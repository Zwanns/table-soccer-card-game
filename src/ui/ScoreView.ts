import Phaser from 'phaser';
import { getFlagAssetKey, getTeamScoreboardCode } from '../data/nationalTeams';
import { ADVANTAGE_VIEW_WIDTH } from './AdvantageView';
import {
  SCOREBOARD_BACKGROUND_ALPHA,
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_FONT_FAMILY,
  MATCH_HEADER_BORDER_ALPHA,
  MATCH_HEADER_BORDER_COLOR,
  MATCH_HEADER_BORDER_WIDTH
} from './scoreboardStyle';
import { px, SHARP_TEXT_RESOLUTION } from './textRendering';

export const SCORE_VIEW_WIDTH = ADVANTAGE_VIEW_WIDTH;
export const SCORE_VIEW_HEIGHT = 78;
export const SCORE_VIEW_BACKGROUND_COLOR = SCOREBOARD_BACKGROUND_COLOR;
export const SCORE_VIEW_BACKGROUND_ALPHA = SCOREBOARD_BACKGROUND_ALPHA;
export const SCORE_VIEW_BORDER_COLOR = MATCH_HEADER_BORDER_COLOR;
export const SCORE_VIEW_BORDER_ALPHA = MATCH_HEADER_BORDER_ALPHA;
export const SCORE_VIEW_BORDER_WIDTH = MATCH_HEADER_BORDER_WIDTH;
export const SCORE_VIEW_FONT_FAMILY = SCOREBOARD_FONT_FAMILY;

export interface ScoreViewOptions {
  penaltyScore?: {
    playerOne: number;
    playerTwo: number;
  };
}

export class ScoreView extends Phaser.GameObjects.Container {
  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerOneName: string,
    playerTwoName: string,
    playerOneFlagCode: string,
    playerTwoFlagCode: string,
    playerOneGoals: number,
    playerTwoGoals: number,
    options: ScoreViewOptions = {}
  ) {
    super(scene, px(x), px(y));

    const background = scene.add.rectangle(0, 0, SCORE_VIEW_WIDTH, SCORE_VIEW_HEIGHT, SCORE_VIEW_BACKGROUND_COLOR, SCORE_VIEW_BACKGROUND_ALPHA);
    background.setStrokeStyle(SCORE_VIEW_BORDER_WIDTH, SCORE_VIEW_BORDER_COLOR, SCORE_VIEW_BORDER_ALPHA);

    const playerOneFlag = this.createFlag(scene, -221, playerOneFlagCode);
    const playerTwoFlag = this.createFlag(scene, 221, playerTwoFlagCode);
    const playerOneLabel = this.createPlayerLabel(scene, -126, getTeamScoreboardCode(playerOneFlagCode), 'right');
    const playerTwoLabel = this.createPlayerLabel(scene, 126, getTeamScoreboardCode(playerTwoFlagCode), 'left');

    const label = scene.add
      .text(0, -1, `${playerOneGoals}:${playerTwoGoals}`, {
        color: '#f6e06e',
        fontFamily: SCORE_VIEW_FONT_FAMILY,
        fontSize: '64px',
        fontStyle: '400',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);

    this.add([background, playerOneFlag, playerOneLabel, label, playerTwoLabel, playerTwoFlag]);

    if (options.penaltyScore !== undefined) {
      this.add(
        scene.add
          .text(0, 29, `PEN ${options.penaltyScore.playerOne}:${options.penaltyScore.playerTwo}`, {
            align: 'center',
            color: '#f0c95a',
            fontFamily: SCORE_VIEW_FONT_FAMILY,
            fontSize: '16px',
            fontStyle: '700',
            resolution: SHARP_TEXT_RESOLUTION
          })
          .setOrigin(0.5)
      );
    }

    scene.add.existing(this);
  }

  private createFlag(scene: Phaser.Scene, x: number, flagCode: string): Phaser.GameObjects.Image {
    const flag = scene.add.image(px(x), 0, getFlagAssetKey(flagCode));
    flag.setDisplaySize(58, 40);
    return flag;
  }

  private createPlayerLabel(scene: Phaser.Scene, x: number, text: string, align: 'left' | 'right'): Phaser.GameObjects.Text {
    return scene.add
      .text(px(x), 0, text, {
        align,
        color: '#d9eadf',
        fontFamily: SCORE_VIEW_FONT_FAMILY,
        fontSize: '32px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION,
        wordWrap: { width: 92 }
      })
      .setOrigin(align === 'left' ? 0 : 1, 0.5);
  }
}
