import Phaser from 'phaser';
import { formatGoalScorerLabel, getMatchStats, type GameState, type PlayerMatchStats } from '../game';
import { getFlagAssetKey, getTeamScoreboardCode } from '../data/nationalTeams';
import { RESULT_ACTION_PANEL_WIDTH } from './resultActionButtons';
import {
  SCOREBOARD_BACKGROUND_ALPHA,
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_BORDER_ALPHA,
  SCOREBOARD_BORDER_COLOR,
  SCOREBOARD_FONT_FAMILY
} from './scoreboardStyle';
import { px, SHARP_TEXT_RESOLUTION } from './textRendering';

export const MATCH_STATS_PANEL_WIDTH = RESULT_ACTION_PANEL_WIDTH;
export const MATCH_STATS_PANEL_HEIGHT = 500;
export const MATCH_STATS_PANEL_CENTER_Y = 360;

export interface MatchStatsPanelOptions {
  state: Readonly<GameState>;
  width?: number;
  height?: number;
}

export class MatchStatsPanel extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, options: MatchStatsPanelOptions) {
    super(scene, px(x), px(y));

    const width = options.width ?? MATCH_STATS_PANEL_WIDTH;
    const height = options.height ?? MATCH_STATS_PANEL_HEIGHT;
    const [playerOne, playerTwo] = options.state.players;
    const [playerOneStats, playerTwoStats] = getMatchStats(options.state);
    const background = scene.add.rectangle(0, 0, width, height, SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA);
    background.setStrokeStyle(2, SCOREBOARD_BORDER_COLOR, SCOREBOARD_BORDER_ALPHA);

    const scoreLine = this.createScoreLine(scene, -height / 2 + 64, {
      playerOneFlagCode: playerOne.flagCode,
      playerTwoFlagCode: playerTwo.flagCode,
      playerOneGoals: playerOneStats.goals,
      playerTwoGoals: playerTwoStats.goals
    });
    const title = scene.add
      .text(0, px(-height / 2 + 120), 'Match stats', {
        align: 'center',
        color: '#ffffff',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '20px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);

    this.add([background, scoreLine, title]);
    this.addStatsRows(scene, playerOneStats, playerTwoStats);
    this.addScorers(scene, width, playerOneStats, playerTwoStats);
    scene.add.existing(this);
  }

  private createScoreLine(
    scene: Phaser.Scene,
    y: number,
    options: {
      playerOneFlagCode: string;
      playerTwoFlagCode: string;
      playerOneGoals: number;
      playerTwoGoals: number;
    }
  ): Phaser.GameObjects.Container {
    const scoreLine = scene.add.container(0, px(y));
    const flagWidth = 56;
    const flagHeight = 38;
    const playerOneFlag = scene.add.image(px(-198), 0, getFlagAssetKey(options.playerOneFlagCode));
    const playerTwoFlag = scene.add.image(px(198), 0, getFlagAssetKey(options.playerTwoFlagCode));
    playerOneFlag.setDisplaySize(flagWidth, flagHeight);
    playerTwoFlag.setDisplaySize(flagWidth, flagHeight);

    const playerOneCode = this.createTeamCode(scene, -112, getTeamScoreboardCode(options.playerOneFlagCode), 'right');
    const playerTwoCode = this.createTeamCode(scene, 112, getTeamScoreboardCode(options.playerTwoFlagCode), 'left');
    const score = scene.add
      .text(0, 0, `${options.playerOneGoals}:${options.playerTwoGoals}`, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '42px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);

    scoreLine.add([playerOneFlag, playerOneCode, score, playerTwoCode, playerTwoFlag]);
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
    playerOneStats: PlayerMatchStats,
    playerTwoStats: PlayerMatchStats
  ): void {
    const rows: Array<[string, string, string]> = [
      ['Goals', String(playerOneStats.goals), String(playerTwoStats.goals)],
      ['Shots', String(playerOneStats.shots), String(playerTwoStats.shots)],
      ['GK saves', String(playerOneStats.goalkeeperSaves), String(playerTwoStats.goalkeeperSaves)]
    ];
    const startY = -56;
    const rowGap = 34;

    rows.forEach(([label, playerOneValue, playerTwoValue], index) => {
      const rowY = startY + index * rowGap;
      this.add(this.createStatsValue(scene, -168, rowY, playerOneValue));
      this.add(this.createStatsLabel(scene, rowY, label));
      this.add(this.createStatsValue(scene, 168, rowY, playerTwoValue));
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

  private addScorers(
    scene: Phaser.Scene,
    width: number,
    playerOneStats: PlayerMatchStats,
    playerTwoStats: PlayerMatchStats
  ): void {
    const titleY = 54;
    const columnWidth = width / 2 - 60;
    const playerOneScorers = formatScorers(playerOneStats);
    const playerTwoScorers = formatScorers(playerTwoStats);

    this.add(this.createStatsLabel(scene, titleY, 'Goalscorers'));
    this.add(this.createScorersList(scene, -168, 92, playerOneScorers, columnWidth));
    this.add(this.createScorersList(scene, 168, 92, playerTwoScorers, columnWidth));
  }

  private createScorersList(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    width: number
  ): Phaser.GameObjects.Text {
    return scene.add
      .text(px(x), px(y), text, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '15px',
        fontStyle: '700',
        lineSpacing: 2,
        resolution: SHARP_TEXT_RESOLUTION,
        wordWrap: { width }
      })
      .setOrigin(0.5, 0);
  }
}

function formatScorers(stats: PlayerMatchStats): string {
  if (stats.scorers.length === 0) {
    return '-';
  }

  return stats.scorers.map((scorer) => `${formatGoalScorerLabel(scorer)} (${scorer.turnNumber})`).join('\n');
}
