import Phaser from 'phaser';
import { formatGoalScorerLabel, getMatchStats, type GameState, type PlayerMatchStats } from '../game';
import { BUTTON_FONT_FAMILY } from './Button';
import { RESULT_ACTION_PANEL_WIDTH } from './resultActionButtons';
import {
  SCOREBOARD_BACKGROUND_ALPHA,
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_BORDER_ALPHA,
  SCOREBOARD_BORDER_COLOR
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
    const [playerOneStats, playerTwoStats] = getMatchStats(options.state);
    const background = scene.add.rectangle(0, 0, width, height, SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA);
    background.setStrokeStyle(2, SCOREBOARD_BORDER_COLOR, SCOREBOARD_BORDER_ALPHA);

    const title = scene.add
      .text(0, px(-height / 2 + 60), 'Match stats', {
        align: 'center',
        color: '#ffffff',
        fontFamily: BUTTON_FONT_FAMILY,
        fontSize: '28px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);

    this.add([background, title]);
    this.addStatsRows(scene, playerOneStats, playerTwoStats);
    this.addScorers(scene, width, playerOneStats, playerTwoStats);
    scene.add.existing(this);
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
    const startY = -116;
    const rowGap = 48;

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
        fontFamily: BUTTON_FONT_FAMILY,
        fontSize: '22px',
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
        fontFamily: BUTTON_FONT_FAMILY,
        fontSize: '28px',
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
    const titleY = 52;
    const columnWidth = width / 2 - 60;
    const playerOneScorers = formatScorers(playerOneStats);
    const playerTwoScorers = formatScorers(playerTwoStats);

    this.add(this.createStatsLabel(scene, titleY, 'Goalscorers'));
    this.add(this.createScorersList(scene, -168, 94, playerOneScorers, columnWidth));
    this.add(this.createScorersList(scene, 168, 94, playerTwoScorers, columnWidth));
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
        fontFamily: BUTTON_FONT_FAMILY,
        fontSize: '19px',
        fontStyle: '700',
        lineSpacing: 4,
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
