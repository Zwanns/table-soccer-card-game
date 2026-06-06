import Phaser from 'phaser';

export class ScoreView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, playerOneGoals: number, playerTwoGoals: number) {
    super(scene, x, y);

    const label = scene.add
      .text(0, 0, `${playerOneGoals} : ${playerTwoGoals}`, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '38px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const caption = scene.add
      .text(0, 34, 'СЧЕТ', {
        color: '#cfe3d4',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px'
      })
      .setOrigin(0.5);

    this.add([label, caption]);
    scene.add.existing(this);
  }
}
