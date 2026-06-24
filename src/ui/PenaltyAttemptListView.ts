import Phaser from 'phaser';
import type { PenaltyAttemptSummary } from '../tournament';
import { getTeamScoreboardCode } from '../data/nationalTeams';
import { SCOREBOARD_FONT_FAMILY } from './scoreboardStyle';
import { formatPenaltyAttempt } from './penaltyAttempts';

export const PENALTY_ATTEMPT_LIST_LEFT_X = 120;
export const PENALTY_ATTEMPT_LIST_RIGHT_X = 1480;
export const PENALTY_ATTEMPT_LIST_TOP_Y = 214;
export const PENALTY_ATTEMPT_LIST_WIDTH = 200;
export const PENALTY_ATTEMPT_LIST_ROW_GAP = 25;
export const PENALTY_ATTEMPT_LIST_MAX_VISIBLE_ROWS = 13;

export class PenaltyAttemptListView extends Phaser.GameObjects.Container {
  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    teamId: string,
    attempts: readonly PenaltyAttemptSummary[]
  ) {
    super(scene, x, y);

    const title = scene.add
      .text(0, 0, getTeamScoreboardCode(teamId), {
        align: 'center',
        color: '#ffffff',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '19px',
        fontStyle: '700'
      })
      .setOrigin(0.5, 0);
    this.add(title);

    const visibleAttempts = attempts.slice(-PENALTY_ATTEMPT_LIST_MAX_VISIBLE_ROWS);
    visibleAttempts.forEach((attempt, index) => {
      const color = attempt.success ? '#71e48b' : '#ff788a';
      const row = scene.add
        .text(-PENALTY_ATTEMPT_LIST_WIDTH / 2, 30 + index * PENALTY_ATTEMPT_LIST_ROW_GAP, formatPenaltyAttempt(attempt), {
          align: 'left',
          color,
          fontFamily: SCOREBOARD_FONT_FAMILY,
          fontSize: '17px',
          fontStyle: '700',
          wordWrap: { width: PENALTY_ATTEMPT_LIST_WIDTH }
        })
        .setOrigin(0, 0);
      this.add(row);
    });

    scene.add.existing(this);
  }
}
