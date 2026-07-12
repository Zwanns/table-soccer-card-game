import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import type { GameState } from '../game';
import {
  MatchStatsPanel,
  MATCH_STATS_PANEL_CENTER_Y,
  MATCH_STATS_PANEL_HEIGHT,
  MATCH_STATS_PANEL_WIDTH
} from './MatchStatsPanel';
import { createResultActionButtons } from './resultActionButtons';
import { SCOREBOARD_BORDER_COLOR } from './scoreboardStyle';

export const MATCH_OVERLAY_DEPTH = 1000;

export interface MatchPauseAction {
  label: string;
  onClick: () => void;
}

export interface MatchPauseOverlayOptions {
  state?: Readonly<GameState>;
  statsPanel?: Phaser.GameObjects.GameObject;
}

export function createMatchPauseOverlay(
  scene: Phaser.Scene,
  actions: readonly MatchPauseAction[],
  options: MatchPauseOverlayOptions = {}
): Phaser.GameObjects.Container {
  const centerX = SCENE_WIDTH / 2;
  const centerY = SCENE_HEIGHT / 2;
  const modal = scene.add.container(0, 0).setDepth(MATCH_OVERLAY_DEPTH);
  const overlay = scene.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72);
  overlay.setInteractive();

  const statsPanel =
    options.statsPanel ??
    (options.state === undefined
      ? null
      : new MatchStatsPanel(scene, centerX, MATCH_STATS_PANEL_CENTER_Y, {
          state: options.state,
          width: MATCH_STATS_PANEL_WIDTH,
          height: MATCH_STATS_PANEL_HEIGHT
        }));
  const buttons = createResultActionButtons(scene, centerX, actions, {
    attachedToPanel: true,
    borderColor: SCOREBOARD_BORDER_COLOR,
    innerBorderColor: 0x000000
  });

  modal.add(statsPanel === null ? [overlay, ...buttons] : [overlay, statsPanel, ...buttons]);
  return modal;
}
