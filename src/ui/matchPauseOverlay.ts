import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import type { GameState } from '../game';
import {
  MatchStatsPanel,
  MATCH_STATS_PANEL_CENTER_Y,
  MATCH_STATS_PANEL_HEIGHT,
  MATCH_STATS_PANEL_WIDTH
} from './MatchStatsPanel';
import { Button } from './Button';
import { createResultActionButtons } from './resultActionButtons';
import { SCOREBOARD_BORDER_COLOR } from './scoreboardStyle';
import { createBlockingModal } from './playerTooltipLifecycle';

export { MATCH_OVERLAY_DEPTH } from './matchUiDepth';

export interface MatchPauseAction {
  label: string;
  onClick: () => void;
}

export interface MatchPauseOverlayOptions {
  state?: Readonly<GameState>;
  secondaryAction?: MatchPauseAction;
  statsPanel?: Phaser.GameObjects.GameObject;
}

export function createMatchPauseOverlay(
  scene: Phaser.Scene,
  actions: readonly MatchPauseAction[],
  options: MatchPauseOverlayOptions = {}
): Phaser.GameObjects.Container {
  const centerX = SCENE_WIDTH / 2;
  const centerY = SCENE_HEIGHT / 2;
  const modal = createBlockingModal(scene);
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
  if (options.secondaryAction) {
    modal.add(new Button(scene, centerX, 32, options.secondaryAction.label, options.secondaryAction.onClick, {
      width: 160, height: 44, fontSize: '20px'
    }));
  }
  return modal;
}
