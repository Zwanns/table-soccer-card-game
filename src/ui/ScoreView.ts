import Phaser from 'phaser';
import { getFlagAssetKey } from '../data/nationalTeams';

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
    playerTwoShots: number
  ) {
    super(scene, x, y);

    const background = scene.add.rectangle(0, 0, 620, 78, 0x08120f, 0.92);
    background.setStrokeStyle(2, 0x436b58, 0.95);

    const playerOneFlag = this.createFlag(scene, -190, playerOneFlagCode);
    const playerTwoFlag = this.createFlag(scene, 190, playerTwoFlagCode);
    const playerOneLabel = this.createPlayerLabel(scene, -190, 26, playerOneName);
    const playerTwoLabel = this.createPlayerLabel(scene, 190, 26, playerTwoName);
    const playerOneShotsText = this.createShotsLabel(scene, -270, playerOneShots);
    const playerTwoShotsText = this.createShotsLabel(scene, 270, playerTwoShots);

    const label = scene.add
      .text(0, -1, `${playerOneGoals}:${playerTwoGoals}`, {
        color: '#f6e06e',
        fontFamily: 'DS-Digital, Arial, sans-serif',
        fontSize: '64px',
        fontStyle: '400'
      })
      .setOrigin(0.5);

    this.add([background, playerOneShotsText, playerOneFlag, playerTwoFlag, playerOneLabel, playerTwoLabel, playerTwoShotsText, label]);
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
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
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
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const value = scene.add
      .text(0, 13, String(shots), {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    container.add([title, value]);

    return container;
  }
}
