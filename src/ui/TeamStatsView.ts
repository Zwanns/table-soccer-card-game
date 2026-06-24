import Phaser from 'phaser';
import {
  createMatchSidePanelBackground,
  MATCH_SIDE_PANEL_HEIGHT,
  MATCH_SIDE_PANEL_HORIZONTAL_PADDING,
  MATCH_SIDE_PANEL_TEXT_STYLE,
  MATCH_SIDE_PANEL_WIDTH
} from './matchSidePanelStyle';
import { createDragScrollArea, TOUCH_SCROLL_WHEEL_FACTOR, clampScroll } from './touchInput';
import { px, SHARP_TEXT_RESOLUTION } from './textRendering';

export const TEAM_STATS_VIEW_WIDTH = MATCH_SIDE_PANEL_WIDTH;
export const TEAM_STATS_VIEW_HEIGHT = MATCH_SIDE_PANEL_HEIGHT;

export interface TeamStatsViewOptions {
  align: 'left' | 'right';
  scorers: readonly string[];
}

export class TeamStatsView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, options: TeamStatsViewOptions) {
    super(scene, px(x), px(y));

    const width = TEAM_STATS_VIEW_WIDTH;
    const height = TEAM_STATS_VIEW_HEIGHT;
    const viewportTop = -height / 2 + 44;
    const viewportHeight = height - 56;
    const viewportWidth = width - MATCH_SIDE_PANEL_HORIZONTAL_PADDING * 2;
    const textOriginX = options.align === 'left' ? 0 : 1;
    const textX = px(
      options.align === 'left'
        ? -width / 2 + MATCH_SIDE_PANEL_HORIZONTAL_PADDING
        : width / 2 - MATCH_SIDE_PANEL_HORIZONTAL_PADDING
    );
    const textAlign = options.align;
    const scorersText = options.scorers.length === 0 ? '-' : options.scorers.join('\n');
    const background = createMatchSidePanelBackground(scene, 0);

    const title = scene.add
      .text(textX, px(-height / 2 + 18), 'Goals', {
        align: textAlign,
        color: '#ffffff',
        fontFamily: MATCH_SIDE_PANEL_TEXT_STYLE.titleFontFamily,
        fontSize: MATCH_SIDE_PANEL_TEXT_STYLE.titleFontSize,
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(textOriginX, 0.5);

    const scorersContent = scene.add.container(0, viewportTop);
    const scorers = scene.add
      .text(textX, 0, scorersText, {
        align: textAlign,
        color: '#d9eadf',
        fontFamily: MATCH_SIDE_PANEL_TEXT_STYLE.itemFontFamily,
        fontSize: MATCH_SIDE_PANEL_TEXT_STYLE.itemFontSize,
        lineSpacing: 3,
        resolution: SHARP_TEXT_RESOLUTION,
        wordWrap: { width: viewportWidth }
      })
      .setOrigin(textOriginX, 0);
    scorersContent.add(scorers);

    const maskGraphics = scene.make.graphics();
    const maskLeft = -width / 2 + MATCH_SIDE_PANEL_HORIZONTAL_PADDING;
    const maskTop = viewportTop;
    const maskSceneX = px(x);
    const maskSceneY = px(y);
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(maskSceneX + maskLeft, maskSceneY + maskTop, viewportWidth, viewportHeight)
      .createGeometryMask();
    const scrollZone = scene.add
      .zone(0, viewportTop + viewportHeight / 2, viewportWidth, viewportHeight)
      .setInteractive({ useHandCursor: scorers.height > viewportHeight });
    const scrollbarTrack = scene.add.rectangle(width / 2 - 7, viewportTop + viewportHeight / 2, 3, viewportHeight, 0xd9eadf, 0.2);
    const thumbHeight =
      scorers.height <= viewportHeight ? viewportHeight : Math.max(18, (viewportHeight / scorers.height) * viewportHeight);
    const scrollbarThumb = scene.add.rectangle(width / 2 - 7, viewportTop + thumbHeight / 2, 5, thumbHeight, 0xf0c95a, 0.88);
    const maxScroll = Math.max(0, scorers.height - viewportHeight);
    let scrollY = 0;

    scorersContent.setMask(mask);
    this.once(Phaser.GameObjects.Events.DESTROY, () => maskGraphics.destroy());

    if (maxScroll === 0) {
      scrollbarTrack.setVisible(false);
      scrollbarThumb.setVisible(false);
    } else {
      const setScroll = (value: number): void => {
        scrollY = clampScroll(value, maxScroll);
        scorersContent.y = viewportTop - scrollY;
        scrollbarThumb.y = viewportTop + thumbHeight / 2 + (scrollY / maxScroll) * (viewportHeight - thumbHeight);
      };
      const dragScroll = createDragScrollArea({
        scene,
        viewport: {
          x: maskSceneX + maskLeft,
          y: maskSceneY + maskTop,
          width: viewportWidth,
          height: viewportHeight
        },
        maxScroll,
        getScroll: () => scrollY,
        setScroll
      });

      scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
        setScroll(scrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
      });
      dragScroll.bindDragTarget(scrollZone);
    }

    this.add([background, title, scorersContent, scrollZone, scrollbarTrack, scrollbarThumb]);
    scene.add.existing(this);
  }
}
