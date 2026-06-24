import Phaser from 'phaser';
import type { PenaltyAttemptSummary } from '../tournament';
import { getTeamScoreboardCode } from '../data/nationalTeams';
import {
  createMatchSidePanelBackground,
  MATCH_SIDE_PANEL_HEIGHT,
  MATCH_SIDE_PANEL_HORIZONTAL_PADDING,
  MATCH_SIDE_PANEL_LEFT_X,
  MATCH_SIDE_PANEL_RIGHT_X,
  MATCH_SIDE_PANEL_TOP_Y,
  MATCH_SIDE_PANEL_WIDTH
} from './matchSidePanelStyle';
import { SCOREBOARD_FONT_FAMILY } from './scoreboardStyle';
import { px, SHARP_TEXT_RESOLUTION } from './textRendering';

export const PENALTY_ATTEMPT_LIST_LEFT_X = MATCH_SIDE_PANEL_LEFT_X;
export const PENALTY_ATTEMPT_LIST_RIGHT_X = MATCH_SIDE_PANEL_RIGHT_X;
export const PENALTY_ATTEMPT_LIST_TOP_Y = MATCH_SIDE_PANEL_TOP_Y;
export const PENALTY_ATTEMPT_LIST_WIDTH = MATCH_SIDE_PANEL_WIDTH;
export const PENALTY_ATTEMPT_LIST_HEIGHT = MATCH_SIDE_PANEL_HEIGHT;
export const PENALTY_ATTEMPT_LIST_ROW_GAP = 27;
export const PENALTY_ATTEMPT_LIST_MAX_VISIBLE_ROWS = 6;
export const PENALTY_ATTEMPT_LIST_PLAYER_FONT_SIZE = '20px';
export const PENALTY_ATTEMPT_LIST_TITLE_FONT_SIZE = '22px';
export const PENALTY_ATTEMPT_LIST_MARKER_FONT_SIZE = '22px';
const RESULT_MARKER_X = PENALTY_ATTEMPT_LIST_WIDTH / 2 - MATCH_SIDE_PANEL_HORIZONTAL_PADDING - 1;
const PLAYER_NAME_MAX_LENGTH = 14;
const FIRST_ATTEMPT_ROW_Y = 54;

export class PenaltyAttemptListView extends Phaser.GameObjects.Container {
  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    teamId: string,
    attempts: readonly PenaltyAttemptSummary[]
  ) {
    super(scene, px(x), px(y));

    const background = createMatchSidePanelBackground(scene, PENALTY_ATTEMPT_LIST_HEIGHT / 2);

    const title = scene.add
      .text(0, 12, getTeamScoreboardCode(teamId), {
        align: 'center',
        color: '#ffffff',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: PENALTY_ATTEMPT_LIST_TITLE_FONT_SIZE,
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5, 0);
    this.add([background, title]);

    const visibleAttempts = attempts.slice(-PENALTY_ATTEMPT_LIST_MAX_VISIBLE_ROWS);
    visibleAttempts.forEach((attempt, index) => {
      const color = attempt.success ? '#71e48b' : '#ff788a';
      const rowY = px(FIRST_ATTEMPT_ROW_Y + index * PENALTY_ATTEMPT_LIST_ROW_GAP);
      const playerName = scene.add
        .text(
          -PENALTY_ATTEMPT_LIST_WIDTH / 2 + MATCH_SIDE_PANEL_HORIZONTAL_PADDING,
          rowY,
          truncatePlayerName(attempt.shooterLabel),
          {
            align: 'left',
            color: '#dfeaf2',
            fontFamily: SCOREBOARD_FONT_FAMILY,
            fontSize: PENALTY_ATTEMPT_LIST_PLAYER_FONT_SIZE,
            fontStyle: '700',
            resolution: SHARP_TEXT_RESOLUTION,
            wordWrap: {
              width: PENALTY_ATTEMPT_LIST_WIDTH - MATCH_SIDE_PANEL_HORIZONTAL_PADDING * 2 - 26,
              useAdvancedWrap: false
            }
          }
        )
        .setOrigin(0, 0.5);
      const resultMarker = scene.add
        .text(RESULT_MARKER_X, rowY, attempt.success ? '✓' : '✗', {
          align: 'right',
          color,
          fontFamily: 'Arial, sans-serif',
          fontSize: PENALTY_ATTEMPT_LIST_MARKER_FONT_SIZE,
          fontStyle: '700',
          resolution: SHARP_TEXT_RESOLUTION
        })
        .setOrigin(1, 0.5);
      this.add([playerName, resultMarker]);
    });

    scene.add.existing(this);
  }
}

function truncatePlayerName(playerName: string): string {
  const trimmedName = playerName.trim();

  return trimmedName.length <= PLAYER_NAME_MAX_LENGTH ? trimmedName : `${trimmedName.slice(0, PLAYER_NAME_MAX_LENGTH - 1)}…`;
}
