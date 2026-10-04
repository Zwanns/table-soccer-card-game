import Phaser from 'phaser';
import type { MatchEventLogEntry } from '../game/MatchEventLog';
import { EVENT_LOG_BOUNDS, EVENT_LOG_BOTTOM_THRESHOLD, EVENT_LOG_ROW_HEIGHT,
  EVENT_LOG_CONTENT_INSET, EVENT_LOG_VIEWPORT_TOP, EVENT_LOG_VIEWPORT_HEIGHT,
  EVENT_LOG_OVERSCAN, EVENT_LOG_POOL_SIZE, formatMatchLogEntry } from './matchEventPresentation';
import { clampScroll, TOUCH_SCROLL_WHEEL_FACTOR } from './touchInput';
import { SHARP_TEXT_RESOLUTION } from './textRendering';

// Above gameplay/flight objects (up to 900), below modal roots and their dim overlays (1000+).
export const EVENT_LOG_DEPTH = 950;

/** Lives outside the recreated gameplay layer: scrolling survives every card action. */
export class EventLogView extends Phaser.GameObjects.Container {
  private readonly rows: Phaser.GameObjects.Text[] = [];
  private readonly rowIndices: number[] = [];
  private readonly formattedText: string[] = [];
  private readonly rowsContainer: Phaser.GameObjects.Container;
  private readonly scrollZone: Phaser.GameObjects.Zone;
  private firstIndex = -1;
  private events: readonly MatchEventLogEntry[] = [];
  private scrollY = 0;
  private maxScroll = 0;
  private entryCount = -1;
  private dragging: { id: number; y: number; scroll: number } | null = null;
  private inputEnabled = true;

  public constructor(scene: Phaser.Scene) {
    const bounds = EVENT_LOG_BOUNDS;
    super(scene, bounds.x, bounds.y);
    const background = scene.add.rectangle(bounds.width / 2, bounds.height / 2, bounds.width, bounds.height, 0x081e16, 0.88);
    background.setStrokeStyle(2, 0x69a77b, 0.85);
    this.rowsContainer = scene.add.container(EVENT_LOG_CONTENT_INSET, EVENT_LOG_VIEWPORT_TOP);
    const graphics = scene.make.graphics();
    graphics.fillStyle(0xffffff).fillRect(bounds.x + EVENT_LOG_CONTENT_INSET, bounds.y + EVENT_LOG_VIEWPORT_TOP,
      bounds.width - EVENT_LOG_CONTENT_INSET * 2, EVENT_LOG_VIEWPORT_HEIGHT);
    const mask = graphics.createGeometryMask();
    graphics.setVisible(false);
    // Mask the pool once, avoiding a stencil pass and batch flush for each Text.
    this.rowsContainer.setMask(mask).setVisible(false).setActive(false);
    for (let i = 0; i < EVENT_LOG_POOL_SIZE; i++) {
      this.rows.push(scene.add.text(0, i * EVENT_LOG_ROW_HEIGHT, '', {
        color: '#ffffff', fontFamily: 'Arial', fontSize: '17px',
        fixedWidth: bounds.width - EVENT_LOG_CONTENT_INSET * 2, fixedHeight: EVENT_LOG_ROW_HEIGHT,
        wordWrap: { width: 0, useAdvancedWrap: false }, resolution: SHARP_TEXT_RESOLUTION
      }).setOrigin(0).setVisible(false));
      this.rowIndices.push(-1);
    }
    this.rowsContainer.add(this.rows);
    const zone = scene.add.zone(bounds.width / 2, bounds.height / 2, bounds.width, bounds.height).setInteractive();
    this.scrollZone = zone;
    zone.disableInteractive();
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.visible && this.inputEnabled) this.dragging = { id: pointer.id, y: pointer.worldY, scroll: this.scrollY };
    });
    const move = (pointer: Phaser.Input.Pointer) => {
      if (this.visible && this.inputEnabled && this.dragging?.id === pointer.id) this.setScroll(this.dragging.scroll + this.dragging.y - pointer.worldY);
    };
    const up = () => { this.dragging = null; };
    scene.input.on('pointermove', move);
    scene.input.on('pointerup', up);
    zone.on('wheel', (_pointer: Phaser.Input.Pointer, _dx: number, dy: number) => {
      if (this.visible && this.inputEnabled) this.setScroll(this.scrollY + dy * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    this.add([background, this.rowsContainer, zone]);
    this.setDepth(EVENT_LOG_DEPTH).setVisible(false).setName('match-event-log');
    scene.add.existing(this);
    this.once('destroy', () => {
      scene.input.off('pointermove', move); scene.input.off('pointerup', up);
      this.rowsContainer.clearMask();
      mask.destroy(); graphics.destroy();
    });
  }

  public refresh(events: readonly MatchEventLogEntry[], _context?: string): void {
    const reset = events.length < this.entryCount || (events !== this.events && events[0] !== this.events[0]);
    if (!reset && this.entryCount === events.length) return;
    const followBottom = this.maxScroll - this.scrollY <= EVENT_LOG_BOTTOM_THRESHOLD;
    this.entryCount = events.length;
    this.events = events;
    this.maxScroll = Math.max(0, events.length * EVENT_LOG_ROW_HEIGHT - EVENT_LOG_VIEWPORT_HEIGHT);
    if (reset) {
      this.formattedText.length = 0;
      this.rowIndices.fill(-1);
      this.firstIndex = -1;
    }
    // Closed overlays track only history and scroll metadata, never row textures.
    this.setScroll(reset || followBottom ? this.maxScroll : this.scrollY, true);
  }

  public toggle(): void {
    if (!this.inputEnabled) return;
    this.setVisible(!this.visible);
    this.dragging = null;
    this.rowsContainer.setVisible(this.visible).setActive(this.visible);
    if (this.visible) {
      this.scrollZone.setInteractive();
      this.setScroll(this.maxScroll, true);
    } else {
      this.scrollZone.disableInteractive();
    }
  }

  /** Suspend interaction without changing visibility, history, row bindings or scroll. */
  public setInputEnabled(enabled: boolean): void {
    this.inputEnabled = enabled && !!this.scene;
    this.dragging = null;
    // Phaser can destroy display objects before the GameScene shutdown listener runs.
    if (!this.scene) return;
    if (enabled && this.visible) this.scrollZone.setInteractive();
    else this.scrollZone.disableInteractive();
  }

  private setScroll(value: number, refresh = false): void {
    const next = clampScroll(value, this.maxScroll);
    if (!refresh && next === this.scrollY) return;
    this.scrollY = next;
    if (!this.visible) return;
    const first = Math.max(0, Math.floor(this.scrollY / EVENT_LOG_ROW_HEIGHT) - EVENT_LOG_OVERSCAN);
    if (refresh || first !== this.firstIndex) this.refreshRows(first);
    // Sub-row drag only moves one container; row bindings and textures stay untouched.
    this.rowsContainer.y = EVENT_LOG_VIEWPORT_TOP + first * EVENT_LOG_ROW_HEIGHT - this.scrollY;
  }

  private refreshRows(first: number): void {
    const moved = first !== this.firstIndex;
    this.firstIndex = first;
    for (let offset = 0; offset < this.rows.length; offset++) {
      const index = first + offset;
      // Ring reuse changes only the row entering the viewport on a one-index scroll.
      const slot = index % this.rows.length;
      const row = this.rows[slot];
      const event = this.events[index];
      const text = event ? (this.formattedText[index] ??= formatMatchLogEntry(event)) : '';
      if (moved) row.y = offset * EVENT_LOG_ROW_HEIGHT;
      if (this.rowIndices[slot] !== index || row.text !== text) {
        if (row.text !== text) row.setText(text);
        row.setData('eventIndex', event ? index : null);
        this.rowIndices[slot] = index;
      }
      if (row.visible !== (event != null)) row.setVisible(event != null);
    }
  }
}
