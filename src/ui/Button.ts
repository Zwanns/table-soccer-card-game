import Phaser from 'phaser';

export interface ButtonCornerRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface ButtonOptions {
  borderRadius?: number | ButtonCornerRadius;
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
    const roundedBackground = hasRoundedCorner(borderRadius) ? scene.add.graphics() : null;
    const drawBackground = (color: number): void => {
      if (roundedBackground !== null) {
        background.setVisible(false);
        roundedBackground.clear();
        roundedBackground.fillStyle(color, disabled ? 0.78 : 1);
        fillButtonRoundedRect(roundedBackground, -width / 2, -height / 2, width, height, borderRadius);
        roundedBackground.lineStyle(2, borderColor);
        strokeButtonRoundedRect(roundedBackground, -width / 2, -height / 2, width, height, borderRadius);
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

function hasRoundedCorner(radius: number | ButtonCornerRadius): boolean {
  if (typeof radius === 'number') {
    return radius > 0;
  }

  return radius.topLeft > 0 || radius.topRight > 0 || radius.bottomRight > 0 || radius.bottomLeft > 0;
}

function fillButtonRoundedRect(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | ButtonCornerRadius
): void {
  if (typeof radius === 'number') {
    graphics.fillRoundedRect(x, y, width, height, radius);
    return;
  }

  drawButtonRoundedRectPath(graphics, x, y, width, height, radius);
  graphics.fillPath();
}

function strokeButtonRoundedRect(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | ButtonCornerRadius
): void {
  if (typeof radius === 'number') {
    graphics.strokeRoundedRect(x, y, width, height, radius);
    return;
  }

  drawButtonRoundedRectPath(graphics, x, y, width, height, radius);
  graphics.strokePath();
}

function drawButtonRoundedRectPath(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: ButtonCornerRadius
): void {
  const maxRadius = Math.min(width, height) / 2;
  const topLeft = Math.min(radius.topLeft, maxRadius);
  const topRight = Math.min(radius.topRight, maxRadius);
  const bottomRight = Math.min(radius.bottomRight, maxRadius);
  const bottomLeft = Math.min(radius.bottomLeft, maxRadius);
  const right = x + width;
  const bottom = y + height;

  graphics.beginPath();
  graphics.moveTo(x + topLeft, y);
  graphics.lineTo(right - topRight, y);

  if (topRight > 0) {
    graphics.arc(right - topRight, y + topRight, topRight, -Math.PI / 2, 0, false);
  }

  graphics.lineTo(right, bottom - bottomRight);

  if (bottomRight > 0) {
    graphics.arc(right - bottomRight, bottom - bottomRight, bottomRight, 0, Math.PI / 2, false);
  }

  graphics.lineTo(x + bottomLeft, bottom);

  if (bottomLeft > 0) {
    graphics.arc(x + bottomLeft, bottom - bottomLeft, bottomLeft, Math.PI / 2, Math.PI, false);
  }

  graphics.lineTo(x, y + topLeft);

  if (topLeft > 0) {
    graphics.arc(x + topLeft, y + topLeft, topLeft, Math.PI, Math.PI * 1.5, false);
  }

  graphics.closePath();
}
