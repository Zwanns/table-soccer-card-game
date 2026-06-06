import Phaser from 'phaser';

export class DeckView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, count: number) {
    super(scene, x, y);

    const back = scene.add.rectangle(-8, 8, 62, 84, 0x17384c);
    back.setStrokeStyle(2, 0x85bfd5);

    const front = scene.add.rectangle(0, 0, 62, 84, 0x214f6b);
    front.setStrokeStyle(2, 0x9ed0e0);

    const text = scene.add
      .text(0, 0, `${count}`, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add([back, front, text]);
    scene.add.existing(this);
  }
}
