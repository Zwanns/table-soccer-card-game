import Phaser from 'phaser';
import type { PenaltyAttemptSummary } from '../tournament';
import { getTeamScoreboardCode } from '../data/nationalTeams';
import { FIELD_GOAL_DEPTH } from './MatchFieldView';
import {
  MATCH_FIELD_CENTER_X,
  MATCH_FIELD_CENTER_Y,
  MATCH_FIELD_HEIGHT,
  MATCH_FIELD_WIDTH,
  MATCH_SCREEN_WIDTH
} from './matchScreenLayout';
import { SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_FONT_FAMILY } from './scoreboardStyle';
import { px, SHARP_TEXT_RESOLUTION } from './textRendering';

const SIDE_CORRIDOR_WIDTH = MATCH_FIELD_CENTER_X - MATCH_FIELD_WIDTH / 2 - FIELD_GOAL_DEPTH;
export const PENALTY_ATTEMPT_LIST_LEFT_X = SIDE_CORRIDOR_WIDTH / 2;
export const PENALTY_ATTEMPT_LIST_RIGHT_X = MATCH_SCREEN_WIDTH - PENALTY_ATTEMPT_LIST_LEFT_X;
export const PENALTY_ATTEMPT_LIST_TOP_Y = MATCH_FIELD_CENTER_Y - MATCH_FIELD_HEIGHT / 2;
export const PENALTY_ATTEMPT_LIST_WIDTH = SIDE_CORRIDOR_WIDTH - 20;
export const PENALTY_ATTEMPT_LIST_HEIGHT = 390;
export const PENALTY_ATTEMPT_LIST_ROW_GAP = 25;
export const PENALTY_ATTEMPT_LIST_MAX_VISIBLE_ROWS = 13;
export const PENALTY_ATTEMPT_LIST_PLAYER_FONT_SIZE = '18px';
const PANEL_BACKGROUND_ALPHA = 0.82;
const PANEL_BORDER_COLOR = 0x284438;
const PANEL_HORIZONTAL_PADDING = 12;
const RESULT_MARKER_X = PENALTY_ATTEMPT_LIST_WIDTH / 2 - PANEL_HORIZONTAL_PADDING - 1;
const PLAYER_NAME_MAX_LENGTH = 14;

export class PenaltyAttemptListView extends Phaser.GameObjects.Container {
  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    teamId: string,
    attempts: readonly PenaltyAttemptSummary[]
  ) {
    super(scene, px(x), px(y));

    const background = scene.add.rectangle(
      0,
      PENALTY_ATTEMPT_LIST_HEIGHT / 2,
      PENALTY_ATTEMPT_LIST_WIDTH,
      PENALTY_ATTEMPT_LIST_HEIGHT,
      SCOREBOARD_BACKGROUND_COLOR,
      PANEL_BACKGROUND_ALPHA
    );
    background.setStrokeStyle(1, PANEL_BORDER_COLOR, 0.8);

    const title = scene.add
      .text(0, 14, getTeamScoreboardCode(teamId), {
        align: 'center',
        color: '#ffffff',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '20px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5, 0);
    this.add([background, title]);

    const visibleAttempts = attempts.slice(-PENALTY_ATTEMPT_LIST_MAX_VISIBLE_ROWS);
    visibleAttempts.forEach((attempt, index) => {
      const color = attempt.success ? '#71e48b' : '#ff788a';
      const rowY = px(48 + index * PENALTY_ATTEMPT_LIST_ROW_GAP);
      const playerName = scene.add
        .text(-PENALTY_ATTEMPT_LIST_WIDTH / 2 + PANEL_HORIZONTAL_PADDING, rowY, truncatePlayerName(attempt.shooterLabel), {
          align: 'left',
          color: '#dfeaf2',
          fontFamily: SCOREBOARD_FONT_FAMILY,
          fontSize: PENALTY_ATTEMPT_LIST_PLAYER_FONT_SIZE,
          fontStyle: '700',
          resolution: SHARP_TEXT_RESOLUTION,
          wordWrap: { width: PENALTY_ATTEMPT_LIST_WIDTH - PANEL_HORIZONTAL_PADDING * 2 - 26, useAdvancedWrap: false }
        })
        .setOrigin(0, 0.5);
      const resultMarker = scene.add
        .text(RESULT_MARKER_X, rowY, attempt.success ? '✓' : '✗', {
          align: 'right',
          color,
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
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
