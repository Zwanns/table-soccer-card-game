import Phaser from 'phaser';

export class StatusPanel extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, attackCardText: string, statusText: string) {
    super(scene, x, y);

    const background = scene.add.rectangle(0, 0, 720, 58, 0x183d2e, 0.96);
    background.setStrokeStyle(2, 0x6aa77c);

    const attackCard = scene.add
      .text(-335, -13, `Текущая карта атаки: ${attackCardText}`, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px'
      })
      .setOrigin(0, 0.5);

    const status = scene.add
      .text(-335, 15, `Статус: ${statusText}`, {
        color: '#cfe3d4',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px'
      })
      .setOrigin(0, 0.5);

    this.add([background, attackCard, status]);
    scene.add.existing(this);
  }
}
