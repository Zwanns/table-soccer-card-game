import { describe, expect, it } from 'vitest';
import { getTeamKitStyle, type TeamKitStyle } from '../data/teamKits';
import { buildTeamColorSwatches, parseHexColor } from '../ui/teamColorSwatches';

const LAYOUT_OPTIONS = {
  swatchY: 62,
  radius: 10,
  gap: 10
} as const;
const PREVIEW_FACE_TOP_Y = 82;

describe('team color swatches', () => {
  it('builds four visible swatches from team kit colors', () => {
    const swatches = buildTeamColorSwatches(getTeamKitStyle('ua'), LAYOUT_OPTIONS);

    expect(swatches).toHaveLength(4);
    expect(swatches.map((swatch) => swatch.role)).toEqual(['primary', 'secondary', 'number', 'stroke']);
    expect(swatches.map((swatch) => swatch.color)).toEqual(['#FFD700', '#0057B8', '#0057B8', '#FFFFFF']);

    for (const swatch of swatches) {
      expect(swatch.radius).toBeGreaterThan(0);
      expect(Number.isFinite(swatch.x)).toBe(true);
      expect(Number.isFinite(swatch.y)).toBe(true);
      expect(swatch.y + swatch.radius).toBeLessThan(PREVIEW_FACE_TOP_Y);
      expect(swatch.fillColor).toBe(parseHexColor(swatch.color));
    }
  });

  it('keeps light and white swatches visible with a dark stroke', () => {
    const swatches = buildTeamColorSwatches(getTeamKitStyle('fr'), LAYOUT_OPTIONS);
    const whiteSwatch = swatches.find((swatch) => swatch.color === '#FFFFFF');

    expect(whiteSwatch).toBeDefined();
    expect(whiteSwatch?.strokeColor).toBe(0x1f2a2e);
  });

  it('skips invalid colors without breaking the layout', () => {
    const style: TeamKitStyle = {
      flagCode: 'test',
      assetKey: 'kit-test',
      path: 'kits/images/test.webp',
      primaryColor: '#112233',
      secondaryColor: 'bad',
      shirtNumberColor: '#FFFFFF',
      shirtNumberStrokeColor: '#000000'
    };
    const swatches = buildTeamColorSwatches(style, LAYOUT_OPTIONS);

    expect(swatches).toHaveLength(3);
    expect(swatches.map((swatch) => swatch.color)).toEqual(['#112233', '#FFFFFF', '#000000']);
  });

  it('parses only #RRGGBB colors for Phaser numeric fillStyle', () => {
    expect(parseHexColor('#FFFFFF')).toBe(0xffffff);
    expect(parseHexColor('#0057B8')).toBe(0x0057b8);
    expect(parseHexColor('0057B8')).toBeNull();
    expect(parseHexColor('#XYZXYZ')).toBeNull();
  });
});
