import type { TeamKitStyle } from '../data/teamKits';

export type TeamColorSwatchRole =
  | 'primary'
  | 'secondary'
  | 'number'
  | 'stroke';

export interface TeamColorSwatch {
  role: TeamColorSwatchRole;
  color: string;
  fillColor: number;
  strokeColor: number;
  x: number;
  y: number;
  radius: number;
}

export interface TeamColorSwatchLayoutOptions {
  swatchY: number;
  radius: number;
  gap: number;
}

const LIGHT_COLOR_STROKE = 0x1f2a2e;
const DEFAULT_SWATCH_STROKE = 0xffffff;
const LIGHT_COLOR_THRESHOLD = 210;

export function buildTeamColorSwatches(
  style: TeamKitStyle | undefined,
  options: TeamColorSwatchLayoutOptions
): TeamColorSwatch[] {
  if (style === undefined || options.radius <= 0) {
    return [];
  }

  const colors = [
    ['primary', style.primaryColor],
    ['secondary', style.secondaryColor],
    ['number', style.shirtNumberColor],
    ['stroke', style.shirtNumberStrokeColor]
  ] as const;
  const validColors = colors
    .map(([role, color]) => ({ role, color, fillColor: parseHexColor(color) }))
    .filter((swatch): swatch is { role: TeamColorSwatchRole; color: string; fillColor: number } => (
      swatch.fillColor !== null
    ));
  const diameter = options.radius * 2;
  const totalWidth = validColors.length * diameter + Math.max(0, validColors.length - 1) * options.gap;
  const startX = -totalWidth / 2 + options.radius;

  return validColors.map((swatch, index) => ({
    ...swatch,
    strokeColor: getSwatchStrokeColor(swatch.fillColor),
    x: startX + index * (diameter + options.gap),
    y: options.swatchY,
    radius: options.radius
  }));
}

export function parseHexColor(hex: string): number | null {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return null;
  }

  return Number.parseInt(hex.slice(1), 16);
}

export function getSwatchStrokeColor(fillColor: number): number {
  return isLightColor(fillColor) ? LIGHT_COLOR_STROKE : DEFAULT_SWATCH_STROKE;
}

function isLightColor(fillColor: number): boolean {
  const red = (fillColor >> 16) & 0xff;
  const green = (fillColor >> 8) & 0xff;
  const blue = fillColor & 0xff;
  const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return luma >= LIGHT_COLOR_THRESHOLD;
}
