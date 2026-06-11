export const KIT_OUTPUT = {
  width: 384,
  height: 420
} as const;

export const KIT_RENDER_GEOMETRY = {
  canvas: KIT_OUTPUT,
  leftArm: {
    x: 36,
    y: 26,
    width: 92,
    height: 170
  },
  body: {
    x: 108,
    y: 20,
    width: 168,
    height: 210
  },
  rightArm: {
    x: 256,
    y: 26,
    width: 92,
    height: 170
  },
  shorts: {
    x: 112,
    y: 228,
    width: 160,
    height: 160
  }
} as const;

export const KIT_RESIZE_KERNEL = 'nearest' as const;
