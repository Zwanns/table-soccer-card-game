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
    playerTwoGoals: number
  ) {
    super(scene, x, y);

    const background = scene.add.rectangle(0, 0, 520, 78, 0x08120f, 0.92);
    background.setStrokeStyle(2, 0x436b58, 0.95);

    const playerOneFlag = this.createFlag(scene, -176, playerOneFlagCode);
    const playerTwoFlag = this.createFlag(scene, 176, playerTwoFlagCode);
    const playerOneLabel = this.createPlayerLabel(scene, -176, 26, playerOneName);
    const playerTwoLabel = this.createPlayerLabel(scene, 176, 26, playerTwoName);

    const label = scene.add
      .text(0, -1, `${playerOneGoals}:${playerTwoGoals}`, {
        color: '#f6e06e',
        fontFamily: 'DS-Digital, Arial, sans-serif',
        fontSize: '64px',
        fontStyle: '400'
      })
      .setOrigin(0.5);

    this.add([background, playerOneFlag, playerTwoFlag, playerOneLabel, playerTwoLabel, label]);
    scene.add.existing(this);
  }

  private createFlag(scene: Phaser.Scene, x: number, flagCode: string): Phaser.GameObjects.Image {
    const flag = scene.add.image(x, -11, getFlagAssetKey(flagCode));
    flag.setDisplaySize(74, 52);
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
}
