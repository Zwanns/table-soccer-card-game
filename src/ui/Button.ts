import Phaser from 'phaser';

export interface ButtonOptions {
  disabled?: boolean;
}

export class Button extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, options: ButtonOptions = {}) {
    super(scene, x, y);

    const width = 220;
    const height = 54;
    const disabled = options.disabled === true;
    const baseColor = disabled ? 0x6d746f : 0xf0c95a;
    const hoverColor = disabled ? 0x6d746f : 0xffd978;
    const background = scene.add.rectangle(0, 0, width, height, baseColor, disabled ? 0.78 : 1);
    background.setStrokeStyle(2, disabled ? 0x3c4540 : 0x2d382f);

    const label = scene.add
      .text(0, 0, text, {
        color: disabled ? '#c6d0ca' : '#1f2a2e',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add([background, label]);
    this.setSize(width, height);

    if (!disabled) {
      this.setInteractive({ useHandCursor: true });
      this.on('pointerover', () => background.setFillStyle(hoverColor));
      this.on('pointerout', () => background.setFillStyle(baseColor));
      this.on('pointerdown', onClick);
    }

    scene.add.existing(this);
  }
}
