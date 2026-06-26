import Phaser from 'phaser';

export interface ButtonOptions {
  borderRadius?: number;
  disabled?: boolean;
  fontSize?: string;
  height?: number;
  width?: number;
}

export class Button extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, options: ButtonOptions = {}) {
    super(scene, x, y);

    const width = options.width ?? 220;
    const height = options.height ?? 54;
    const borderRadius = options.borderRadius ?? 0;
    const disabled = options.disabled === true;
    const baseColor = disabled ? 0x6d746f : 0xf0c95a;
    const hoverColor = disabled ? 0x6d746f : 0xffd978;
    const borderColor = disabled ? 0x3c4540 : 0x2d382f;
    const background = scene.add.rectangle(0, 0, width, height, baseColor, disabled ? 0.78 : 1);
    const roundedBackground = borderRadius > 0 ? scene.add.graphics() : null;
    const drawBackground = (color: number): void => {
      if (roundedBackground !== null) {
        background.setVisible(false);
        roundedBackground.clear();
        roundedBackground.fillStyle(color, disabled ? 0.78 : 1);
        roundedBackground.fillRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        roundedBackground.lineStyle(2, borderColor);
        roundedBackground.strokeRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        return;
      }

      background.setFillStyle(color, disabled ? 0.78 : 1);
      background.setStrokeStyle(2, borderColor);
    };

    drawBackground(baseColor);

    const label = scene.add
      .text(0, 0, text, {
        color: disabled ? '#c6d0ca' : '#1f2a2e',
        fontFamily: 'Arial, sans-serif',
        fontSize: options.fontSize ?? '22px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add(roundedBackground === null ? [background, label] : [background, roundedBackground, label]);
    this.setSize(width, height);

    if (!disabled) {
      this.setInteractive({ useHandCursor: true });
      this.on('pointerover', () => drawBackground(hoverColor));
      this.on('pointerout', () => drawBackground(baseColor));
      this.on('pointerdown', onClick);
    }

    scene.add.existing(this);
  }
}
