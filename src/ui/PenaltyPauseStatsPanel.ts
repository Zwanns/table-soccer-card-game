import Phaser from 'phaser';
import { getFlagAssetKey, getTeamScoreboardCode } from '../data/nationalTeams';
import type { PenaltyShootoutState, TournamentMatchResult } from '../tournament';
import {
  MATCH_STATS_PANEL_HEIGHT,
  MATCH_STATS_PANEL_WIDTH
} from './MatchStatsPanel';
import {
  SCOREBOARD_BACKGROUND_ALPHA,
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_BORDER_ALPHA,
  SCOREBOARD_BORDER_COLOR,
  SCOREBOARD_FONT_FAMILY
} from './scoreboardStyle';
import { px, SHARP_TEXT_RESOLUTION } from './textRendering';

export interface PenaltyPauseStatsPanelOptions {
  matchResult: TournamentMatchResult;
  shootoutState: PenaltyShootoutState;
  width?: number;
  height?: number;
}

export class PenaltyPauseStatsPanel extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, options: PenaltyPauseStatsPanelOptions) {
    super(scene, px(x), px(y));

    const width = options.width ?? MATCH_STATS_PANEL_WIDTH;
    const height = options.height ?? MATCH_STATS_PANEL_HEIGHT;
    const background = scene.add.rectangle(0, 0, width, height, SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA);
    background.setStrokeStyle(2, SCOREBOARD_BORDER_COLOR, SCOREBOARD_BORDER_ALPHA);

    const scoreLine = this.createScoreLine(scene, -height / 2 + 64, options.matchResult, options.shootoutState);
    const title = scene.add
      .text(0, px(-height / 2 + 120), 'Penalty stats', {
        align: 'center',
        color: '#ffffff',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '20px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);

    this.add([background, scoreLine, title]);
    this.addStatsRows(scene, options.matchResult, options.shootoutState);
    scene.add.existing(this);
  }

  private createScoreLine(
    scene: Phaser.Scene,
    y: number,
    matchResult: TournamentMatchResult,
    shootoutState: PenaltyShootoutState
  ): Phaser.GameObjects.Container {
    const scoreLine = scene.add.container(0, px(y));
    const flagWidth = 56;
    const flagHeight = 38;
    const homeFlag = scene.add.image(px(-198), 0, getFlagAssetKey(matchResult.homeTeamId));
    const awayFlag = scene.add.image(px(198), 0, getFlagAssetKey(matchResult.awayTeamId));
    homeFlag.setDisplaySize(flagWidth, flagHeight);
    awayFlag.setDisplaySize(flagWidth, flagHeight);

    const homeCode = this.createTeamCode(scene, -112, getTeamScoreboardCode(matchResult.homeTeamId), 'right');
    const awayCode = this.createTeamCode(scene, 112, getTeamScoreboardCode(matchResult.awayTeamId), 'left');
    const score = scene.add
      .text(0, -7, `${matchResult.homeGoals}:${matchResult.awayGoals}`, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '42px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);
    const penaltyScore = scene.add
      .text(0, 25, `PEN ${shootoutState.homeGoals}:${shootoutState.awayGoals}`, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '16px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);

    scoreLine.add([homeFlag, homeCode, score, penaltyScore, awayCode, awayFlag]);
    return scoreLine;
  }

  private createTeamCode(
    scene: Phaser.Scene,
    x: number,
    text: string,
    align: 'left' | 'right'
  ): Phaser.GameObjects.Text {
    return scene.add
      .text(px(x), 0, text, {
        align,
        color: '#dfeaf2',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '28px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION,
        wordWrap: { width: 82 }
      })
      .setOrigin(align === 'left' ? 0 : 1, 0.5);
  }

  private addStatsRows(
    scene: Phaser.Scene,
    matchResult: TournamentMatchResult,
    shootoutState: PenaltyShootoutState
  ): void {
    const rows: Array<[string, string, string]> = [
      ['Match goals', String(matchResult.homeGoals), String(matchResult.awayGoals)],
      ['Penalties', String(shootoutState.homeGoals), String(shootoutState.awayGoals)],
      ['Attempts', String(shootoutState.homeKicks), String(shootoutState.awayKicks)],
      ['GK saves', String(getPenaltyGoalkeeperSaves(shootoutState, 'home')), String(getPenaltyGoalkeeperSaves(shootoutState, 'away'))]
    ];
    const startY = -56;
    const rowGap = 34;

    rows.forEach(([label, homeValue, awayValue], index) => {
      const rowY = startY + index * rowGap;
      this.add(this.createStatsValue(scene, -168, rowY, homeValue));
      this.add(this.createStatsLabel(scene, rowY, label));
      this.add(this.createStatsValue(scene, 168, rowY, awayValue));
    });
  }

  private createStatsLabel(scene: Phaser.Scene, y: number, text: string): Phaser.GameObjects.Text {
    return scene.add
      .text(0, px(y), text, {
        align: 'center',
        color: '#ffffff',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '17px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);
  }

  private createStatsValue(scene: Phaser.Scene, x: number, y: number, text: string): Phaser.GameObjects.Text {
    return scene.add
      .text(px(x), px(y), text, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '22px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);
  }
}

function getPenaltyGoalkeeperSaves(shootoutState: PenaltyShootoutState, side: 'home' | 'away'): number {
  const opponentTeamId = side === 'home' ? shootoutState.awayTeamId : shootoutState.homeTeamId;

  return shootoutState.kicks.filter((kick) => kick.shooterTeamId === opponentTeamId && kick.outcome === 'save').length;
}
