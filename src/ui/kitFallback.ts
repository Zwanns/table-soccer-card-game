import type { CardColor } from '../cards';

export type FallbackKitColorScheme = {
  shirt: number;
  shorts: number;
  socks: number;
  accent: number;
  number: string;
};

export function getFallbackKitColors(teamColor?: CardColor): FallbackKitColorScheme {
  if (teamColor === 'BLACK') {
    return {
      shirt: 0xd9eadf,
      shorts: 0x1f2a2e,
      socks: 0xd9eadf,
      accent: 0x9fc5ad,
      number: '#1f2a2e'
    };
  }

  return {
    shirt: 0xc43845,
    shorts: 0xffffff,
    socks: 0xc43845,
    accent: 0xf1d4d6,
    number: '#ffffff'
  };
}
