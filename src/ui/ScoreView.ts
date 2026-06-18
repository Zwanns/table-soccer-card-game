import Phaser from 'phaser';
import { getFlagAssetKey, getTeamScoreboardCode } from '../data/nationalTeams';
import { ADVANTAGE_VIEW_WIDTH } from './AdvantageView';

export const SCORE_VIEW_WIDTH = ADVANTAGE_VIEW_WIDTH;
export const SCORE_VIEW_HEIGHT = 78;
export const SCORE_VIEW_BACKGROUND_COLOR = 0x08120f;
export const SCORE_VIEW_BORDER_COLOR = 0xf0c95a;
export const SCORE_VIEW_FONT_FAMILY = 'DS-Digital, Arial, sans-serif';
const SCORE_VIEW_BACKGROUND_ALPHA = 0.92;

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
    playerOneShots: number,
    playerTwoShots: number,
    options: ScoreViewOptions = {}
  ) {
    super(scene, x, y);

    const background = scene.add.rectangle(0, 0, SCORE_VIEW_WIDTH, SCORE_VIEW_HEIGHT, SCORE_VIEW_BACKGROUND_COLOR, SCORE_VIEW_BACKGROUND_ALPHA);
    background.setStrokeStyle(2, SCORE_VIEW_BORDER_COLOR, 0.95);

    const playerOneFlag = this.createFlag(scene, -158, playerOneFlagCode);
    const playerTwoFlag = this.createFlag(scene, 158, playerTwoFlagCode);
    const playerOneLabel = this.createPlayerLabel(scene, -158, 26, getTeamScoreboardCode(playerOneFlagCode));
    const playerTwoLabel = this.createPlayerLabel(scene, 158, 26, getTeamScoreboardCode(playerTwoFlagCode));
    const playerOneShotsText = this.createShotsLabel(scene, -226, playerOneShots);
    const playerTwoShotsText = this.createShotsLabel(scene, 226, playerTwoShots);

    const label = scene.add
      .text(0, -1, `${playerOneGoals}:${playerTwoGoals}`, {
        color: '#f6e06e',
        fontFamily: SCORE_VIEW_FONT_FAMILY,
        fontSize: '64px',
        fontStyle: '400'
      })
      .setOrigin(0.5);

    this.add([background, playerOneShotsText, playerOneFlag, playerTwoFlag, playerOneLabel, playerTwoLabel, playerTwoShotsText, label]);

    if (options.penaltyScore !== undefined) {
      this.add(
        scene.add
          .text(0, 29, `PEN ${options.penaltyScore.playerOne}:${options.penaltyScore.playerTwo}`, {
            align: 'center',
            color: '#f0c95a',
            fontFamily: SCORE_VIEW_FONT_FAMILY,
            fontSize: '16px',
            fontStyle: '700'
          })
          .setOrigin(0.5)
      );
    }

    scene.add.existing(this);
  }

  private createFlag(scene: Phaser.Scene, x: number, flagCode: string): Phaser.GameObjects.Image {
    const flag = scene.add.image(x, -9, getFlagAssetKey(flagCode));
    flag.setDisplaySize(58, 40);
    return flag;
  }

  private createPlayerLabel(scene: Phaser.Scene, x: number, y: number, text: string): Phaser.GameObjects.Text {
    return scene.add
      .text(x, y, text, {
        align: 'center',
        color: '#d9eadf',
        fontFamily: SCORE_VIEW_FONT_FAMILY,
        fontSize: '18px',
        fontStyle: '700',
        wordWrap: { width: 130 }
      })
      .setOrigin(0.5);
  }

  private createShotsLabel(scene: Phaser.Scene, x: number, shots: number): Phaser.GameObjects.Container {
    const container = scene.add.container(x, 0);
    const title = scene.add
      .text(0, -13, 'Shots:', {
        align: 'center',
        color: '#d9eadf',
        fontFamily: SCORE_VIEW_FONT_FAMILY,
        fontSize: '17px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const value = scene.add
      .text(0, 13, String(shots), {
        align: 'center',
        color: '#ffffff',
        fontFamily: SCORE_VIEW_FONT_FAMILY,
        fontSize: '22px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    container.add([title, value]);

    return container;
  }
}
