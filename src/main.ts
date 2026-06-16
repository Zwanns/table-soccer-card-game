import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SCENE_HEIGHT, SCENE_WIDTH } from './config';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { ResultScene } from './scenes/ResultScene';
import { SquadEditorScene } from './scenes/SquadEditorScene';
import { SquadSelectScene } from './scenes/SquadSelectScene';
import { TeamSelectScene } from './scenes/TeamSelectScene';
import { TournamentCompleteScene } from './scenes/TournamentCompleteScene';
import { TournamentHubScene } from './scenes/TournamentHubScene';
import { TournamentPenaltyScene } from './scenes/TournamentPenaltyScene';
import { TournamentSetupScene } from './scenes/TournamentSetupScene';
import '@fontsource/anton/400.css';
import '@fontsource/bangers/400.css';
import '@fontsource/oswald/600.css';
import './styles/main.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: SCENE_WIDTH,
  height: SCENE_HEIGHT,
  backgroundColor: '#0b5f3a',
  scene: [
    BootScene,
    MenuScene,
    TeamSelectScene,
    SquadSelectScene,
    SquadEditorScene,
    TournamentSetupScene,
    TournamentHubScene,
    TournamentPenaltyScene,
    TournamentCompleteScene,
    GameScene,
    ResultScene
  ],
  dom: {
    createContainer: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);
let resizeTimers: number[] = [];

function scheduleScaleRefresh(): void {
  clearScheduledScaleRefreshes();

  const delays = isMobileLikeInputViewport() ? [50, 250, 600] : [250];

  resizeTimers = delays.map((delay) => window.setTimeout(() => refreshScaleAndInputBounds(game), delay));
}

function clearScheduledScaleRefreshes(): void {
  for (const timer of resizeTimers) {
    window.clearTimeout(timer);
  }

  resizeTimers = [];
}

function refreshScaleAndInputBounds(refreshGame: Phaser.Game): void {
  refreshGame.scale.refresh();
  refreshGame.scale.updateBounds();
}

function isMobileLikeInputViewport(): boolean {
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 700;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches === true;
  const touchDevice = navigator.maxTouchPoints > 0;

  return smallViewport && (coarsePointer || touchDevice);
}

window.addEventListener('resize', scheduleScaleRefresh, { passive: true });
window.addEventListener('orientationchange', scheduleScaleRefresh, { passive: true });

if (new URLSearchParams(window.location.search).get('debugInput') === '1') {
  enableInputDebug(game);
}

function enableInputDebug(debugGame: Phaser.Game): void {
  const panel = document.createElement('pre');
  panel.style.position = 'fixed';
  panel.style.left = '8px';
  panel.style.top = '8px';
  panel.style.zIndex = '10001';
  panel.style.margin = '0';
  panel.style.padding = '8px';
  panel.style.maxWidth = 'min(560px, calc(100vw - 16px))';
  panel.style.whiteSpace = 'pre-wrap';
  panel.style.pointerEvents = 'none';
  panel.style.color = '#ffffff';
  panel.style.background = 'rgba(0, 0, 0, 0.72)';
  panel.style.font = '12px/1.35 monospace';
  document.body.append(panel);

  const markers = new WeakMap<Phaser.Scene, Phaser.GameObjects.Graphics>();

  const drawMarker = (event: PointerEvent | MouseEvent): void => {
    const scene = debugGame.scene.getScenes(true)[0];
    const pointer = debugGame.input.activePointer;

    if (scene == null || pointer == null) {
      return;
    }

    let marker = markers.get(scene);

    if (marker == null || !marker.active) {
      marker = scene.add.graphics();
      marker.setDepth(100000);
      markers.set(scene, marker);
    }

    marker.clear();
    const manual = mapClientToGame(debugGame, event);

    marker.lineStyle(3, 0x3399ff, 1);
    marker.strokeCircle(manual.x, manual.y, 15);
    marker.lineStyle(3, 0xff3355, 1);
    marker.lineBetween(pointer.x - 18, pointer.y, pointer.x + 18, pointer.y);
    marker.lineBetween(pointer.x, pointer.y - 18, pointer.x, pointer.y + 18);
  };

  window.addEventListener(
    'pointerdown',
    (event) => {
      window.setTimeout(() => drawMarker(event), 0);
    },
    { passive: true }
  );

  const updatePanel = (): void => {
    const rect = debugGame.canvas.getBoundingClientRect();
    const bounds = debugGame.scale.canvasBounds;
    const pointer = debugGame.input.activePointer;
    const event = pointer?.event as PointerEvent | MouseEvent | undefined;
    const clientX = event != null && 'clientX' in event ? event.clientX : undefined;
    const clientY = event != null && 'clientY' in event ? event.clientY : undefined;
    const manual = event == null ? undefined : mapClientToGame(debugGame, event);

    panel.textContent = [
      'debugInput=1',
      `canvas rect: left=${rect.left.toFixed(1)} top=${rect.top.toFixed(1)} width=${rect.width.toFixed(1)} height=${rect.height.toFixed(1)}`,
      `scale canvasBounds: left=${bounds.left.toFixed(1)} top=${bounds.top.toFixed(1)} width=${bounds.width.toFixed(1)} height=${bounds.height.toFixed(1)}`,
      `scale displaySize: ${debugGame.scale.displaySize.width} x ${debugGame.scale.displaySize.height}`,
      `scale gameSize: ${debugGame.scale.gameSize.width} x ${debugGame.scale.gameSize.height}`,
      `pointer client: ${formatDebugNumber(clientX)}, ${formatDebugNumber(clientY)}`,
      `pointer game: ${formatDebugNumber(pointer?.x)}, ${formatDebugNumber(pointer?.y)}`,
      `pointer world: ${formatDebugNumber(pointer?.worldX)}, ${formatDebugNumber(pointer?.worldY)}`,
      `manual game: ${formatDebugNumber(manual?.x)}, ${formatDebugNumber(manual?.y)}`,
      `delta game: ${formatDebugNumber(manual == null ? undefined : (pointer?.x ?? 0) - manual.x)}, ${formatDebugNumber(
        manual == null ? undefined : (pointer?.y ?? 0) - manual.y
      )}`
    ].join('\n');

    window.requestAnimationFrame(updatePanel);
  };

  updatePanel();
}

function mapClientToGame(debugGame: Phaser.Game, event: PointerEvent | MouseEvent): { x: number; y: number } {
  const rect = debugGame.canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * debugGame.scale.gameSize.width,
    y: ((event.clientY - rect.top) / rect.height) * debugGame.scale.gameSize.height
  };
}

function formatDebugNumber(value: number | undefined): string {
  return value == null ? '-' : value.toFixed(1);
}
