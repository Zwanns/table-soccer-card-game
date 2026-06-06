import Phaser from 'phaser';

export class ScoreView extends Phaser.GameObjects.Container {
  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerOneName: string,
    playerTwoName: string,
    playerOneGoals: number,
    playerTwoGoals: number
  ) {
    super(scene, x, y);

    const background = scene.add.rectangle(0, 0, 420, 78, 0x08120f, 0.92);
    background.setStrokeStyle(2, 0x436b58, 0.95);

    const playerOneLabel = this.createPlayerLabel(scene, -186, playerOneName, 'left');
    const playerTwoLabel = this.createPlayerLabel(scene, 186, playerTwoName, 'right');

    const label = scene.add
      .text(0, -1, `${playerOneGoals}:${playerTwoGoals}`, {
        color: '#f6e06e',
        fontFamily: 'DS-Digital, Arial, sans-serif',
        fontSize: '64px',
        fontStyle: '400'
      })
      .setOrigin(0.5);

    this.add([background, playerOneLabel, playerTwoLabel, label]);
    scene.add.existing(this);
  }

  private createPlayerLabel(scene: Phaser.Scene, x: number, text: string, align: 'left' | 'right'): Phaser.GameObjects.Text {
    return scene.add
      .text(x, 0, text, {
        align,
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700',
        wordWrap: { width: 128 }
      })
      .setOrigin(align === 'left' ? 0 : 1, 0.5);
  }
}
