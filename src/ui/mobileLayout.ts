export interface MobileLayoutEnvironment {
  innerWidth?: number;
  innerHeight?: number;
  matchMedia?: (query: string) => { matches: boolean };
  maxTouchPoints?: number;
  ontouchstart?: unknown;
}

export function isMobileLandscapeLayout(environment: MobileLayoutEnvironment = getBrowserMobileLayoutEnvironment()): boolean {
  const { innerWidth, innerHeight } = environment;

  if (typeof innerWidth !== 'number' || typeof innerHeight !== 'number') {
    return false;
  }

  const hasCoarsePointer = environment.matchMedia?.('(pointer: coarse)').matches ?? false;
  const hasTouchEvent = 'ontouchstart' in environment;
  const hasTouchPoints = (environment.maxTouchPoints ?? 0) > 0;

  return (hasCoarsePointer || hasTouchEvent || hasTouchPoints) && innerWidth > innerHeight;
}

function getBrowserMobileLayoutEnvironment(): MobileLayoutEnvironment {
  const browserGlobal = globalThis as typeof globalThis & {
    innerWidth?: number;
    innerHeight?: number;
    matchMedia?: (query: string) => { matches: boolean };
    navigator?: { maxTouchPoints?: number };
    ontouchstart?: unknown;
  };

  return {
    innerWidth: browserGlobal.innerWidth,
    innerHeight: browserGlobal.innerHeight,
    matchMedia: browserGlobal.matchMedia?.bind(browserGlobal),
    maxTouchPoints: browserGlobal.navigator?.maxTouchPoints,
    ...('ontouchstart' in browserGlobal ? { ontouchstart: browserGlobal.ontouchstart } : {})
  };
}
