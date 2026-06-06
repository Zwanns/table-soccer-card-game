import Phaser from 'phaser';

export class ScoreView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, playerOneGoals: number, playerTwoGoals: number) {
    super(scene, x, y);

    const background = scene.add.rectangle(0, 0, 172, 72, 0x08120f, 0.92);
    background.setStrokeStyle(2, 0x436b58, 0.95);

    const label = scene.add
      .text(0, -6, `${playerOneGoals}:${playerTwoGoals}`, {
        color: '#f6e06e',
        fontFamily: 'DS-Digital, Arial, sans-serif',
        fontSize: '50px',
        fontStyle: '400'
      })
      .setOrigin(0.5);

    const caption = scene.add
      .text(0, 25, 'СЧЕТ', {
        color: '#8fb49b',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add([background, label, caption]);
    scene.add.existing(this);
  }
}
