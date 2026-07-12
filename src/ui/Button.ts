import Phaser from 'phaser';

export interface ButtonCornerRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface ButtonOptions {
  borderColor?: number;
  borderRadius?: number | ButtonCornerRadius;
  borderWidth?: number;
  disabled?: boolean;
  fontSize?: string;
  height?: number;
  leftBorderColor?: number;
  rightBorderColor?: number;
  width?: number;
}

export class Button extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, options: ButtonOptions = {}) {
    super(scene, x, y);

    const width = options.width ?? 220;
    const height = options.height ?? 54;
    const borderRadius = options.borderRadius ?? 0;
    const borderWidth = options.borderWidth ?? 2;
    const disabled = options.disabled === true;
    const baseColor = disabled ? 0x6d746f : 0xf0c95a;
    const hoverColor = disabled ? 0x6d746f : 0xffd978;
    const borderColor = options.borderColor ?? (disabled ? 0x3c4540 : 0x2d382f);
    const background = scene.add.rectangle(0, 0, width, height, baseColor, disabled ? 0.78 : 1);
    const roundedBackground = hasRoundedCorner(borderRadius) ? scene.add.graphics() : null;
    const drawBackground = (color: number): void => {
      if (roundedBackground !== null) {
        background.setVisible(false);
        roundedBackground.clear();
        roundedBackground.fillStyle(color, disabled ? 0.78 : 1);
        fillButtonRoundedRect(roundedBackground, -width / 2, -height / 2, width, height, borderRadius);
        if (borderWidth > 0) {
          roundedBackground.lineStyle(borderWidth, borderColor);
          strokeButtonRoundedRect(roundedBackground, -width / 2, -height / 2, width, height, borderRadius);
        }
        return;
      }

      background.setFillStyle(color, disabled ? 0.78 : 1);
      if (borderWidth > 0) {
        background.setStrokeStyle(borderWidth, borderColor);
      }
    };

    drawBackground(baseColor);
    const sideBorders = createButtonSideBorders(scene, width, height, borderWidth, options);

    const label = scene.add
      .text(0, 0, text, {
        color: disabled ? '#c6d0ca' : '#1f2a2e',
        fontFamily: 'Arial, sans-serif',
        fontSize: options.fontSize ?? '22px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add(
      roundedBackground === null
        ? [background, ...(sideBorders === null ? [] : [sideBorders]), label]
        : [background, roundedBackground, ...(sideBorders === null ? [] : [sideBorders]), label]
    );
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

function createButtonSideBorders(
  scene: Phaser.Scene,
  width: number,
  height: number,
  borderWidth: number,
  options: ButtonOptions
): Phaser.GameObjects.Graphics | null {
  if (borderWidth <= 0 || (options.leftBorderColor === undefined && options.rightBorderColor === undefined)) {
    return null;
  }

  const graphics = scene.add.graphics();
  if (options.leftBorderColor !== undefined) {
    graphics.lineStyle(borderWidth, options.leftBorderColor);
    graphics.lineBetween(-width / 2, -height / 2, -width / 2, height / 2);
  }
  if (options.rightBorderColor !== undefined) {
    graphics.lineStyle(borderWidth, options.rightBorderColor);
    graphics.lineBetween(width / 2, -height / 2, width / 2, height / 2);
  }
  return graphics;
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
