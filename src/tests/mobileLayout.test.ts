import { describe, expect, it } from 'vitest';
import { isMobileLandscapeLayout } from '../ui/mobileLayout';

describe('mobile layout detection', () => {
  it('returns true for coarse pointer landscape screens', () => {
    expect(isMobileLandscapeLayout({
      innerWidth: 940,
      innerHeight: 430,
      matchMedia: () => ({ matches: true })
    })).toBe(true);
  });

  it('returns true for touch event landscape screens', () => {
    expect(isMobileLandscapeLayout({
      innerWidth: 940,
      innerHeight: 430,
      ontouchstart: undefined
    })).toBe(true);
  });

  it('returns true for maxTouchPoints landscape screens', () => {
    expect(isMobileLandscapeLayout({
      innerWidth: 940,
      innerHeight: 430,
      maxTouchPoints: 5
    })).toBe(true);
  });

  it('returns false for a mouse desktop browser even in landscape', () => {
    expect(isMobileLandscapeLayout({
      innerWidth: 1600,
      innerHeight: 720,
      matchMedia: () => ({ matches: false }),
      maxTouchPoints: 0
    })).toBe(false);
  });

  it('returns false for touch portrait screens', () => {
    expect(isMobileLandscapeLayout({
      innerWidth: 430,
      innerHeight: 940,
      matchMedia: () => ({ matches: true }),
      maxTouchPoints: 5
    })).toBe(false);
  });

  it('returns false when viewport dimensions are unavailable', () => {
    expect(isMobileLandscapeLayout({
      matchMedia: () => ({ matches: true }),
      maxTouchPoints: 5
    })).toBe(false);
  });
});
