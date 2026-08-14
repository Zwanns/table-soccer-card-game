export interface CssSafeAreaInsets {
  readonly coordinateSpace: 'css-pixels';
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

export interface LogicalSafeAreaInsets {
  readonly coordinateSpace: 'phaser-logical';
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

export interface SafeAreaCanvasRect {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}

export interface LogicalGameSize {
  readonly width: number;
  readonly height: number;
}

export interface LogicalSafeAreaCalculation {
  readonly cssInsets: CssSafeAreaInsets;
  readonly canvasRect: SafeAreaCanvasRect;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly logicalWidth: number;
  readonly logicalHeight: number;
}

export interface CssSafeAreaComputedStyle {
  readonly paddingLeft?: string | null;
  readonly paddingRight?: string | null;
  readonly paddingTop?: string | null;
  readonly paddingBottom?: string | null;
}

export interface CssSafeAreaProbeStyle {
  position?: string;
  visibility?: string;
  pointerEvents?: string;
  width?: string;
  height?: string;
  paddingLeft?: string;
  paddingRight?: string;
  paddingTop?: string;
  paddingBottom?: string;
}

export interface CssSafeAreaProbeElement {
  readonly style: CssSafeAreaProbeStyle;
  remove(): void;
}

export interface CssSafeAreaProbeParent {
  appendChild(element: CssSafeAreaProbeElement): unknown;
}

export interface CssSafeAreaDocument {
  readonly body?: CssSafeAreaProbeParent | null;
  readonly documentElement?: CssSafeAreaProbeParent | null;
  createElement(tagName: string): CssSafeAreaProbeElement;
}

export interface CssSafeAreaReaderEnvironment {
  readonly document?: CssSafeAreaDocument | null;
  readonly getComputedStyle?: ((element: CssSafeAreaProbeElement) => CssSafeAreaComputedStyle) | null;
}

export interface SafeAreaEventTarget {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface SafeAreaVisualViewport extends SafeAreaEventTarget {}

export interface SafeAreaWindow extends SafeAreaEventTarget {
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly visualViewport?: SafeAreaVisualViewport | null;
  requestAnimationFrame?(callback: FrameRequestCallback): number;
  cancelAnimationFrame?(handle: number): void;
}

export interface SafeAreaCanvas {
  getBoundingClientRect(): SafeAreaCanvasRect;
}

export interface SafeAreaGame {
  readonly canvas?: SafeAreaCanvas | null;
  readonly scale?: {
    readonly gameSize?: LogicalGameSize | null;
  } | null;
  readonly config?: {
    readonly width?: number | string;
    readonly height?: number | string;
  } | null;
}

export interface SafeAreaRuntime extends CssSafeAreaReaderEnvironment {
  readonly window?: SafeAreaWindow | null;
  readonly screenOrientation?: SafeAreaEventTarget | null;
  readonly visualViewport?: SafeAreaVisualViewport | null;
  readonly requestAnimationFrame?: ((callback: FrameRequestCallback) => number) | null;
  readonly cancelAnimationFrame?: ((handle: number) => void) | null;
  readonly readCssInsets?: (() => CssSafeAreaInsets) | null;
}

export interface SafeAreaSubscription {
  dispose(): void;
}

export type SafeAreaSubscriber = (insets: LogicalSafeAreaInsets) => void;

export const SAFE_AREA_CHANGE_TOLERANCE = 0.01;

function zeroCssSafeAreaInsets(): CssSafeAreaInsets {
  return {
    coordinateSpace: 'css-pixels',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  };
}

function zeroLogicalSafeAreaInsets(): LogicalSafeAreaInsets {
  return {
    coordinateSpace: 'phaser-logical',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  };
}

export function parseCssPixelValue(value: string | null | undefined): number {
  if (typeof value !== 'string') {
    return 0;
  }

  const match = value.trim().match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))px$/i);
  if (match === null) {
    return 0;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function parseCssSafeAreaInsets(
  computedStyle: CssSafeAreaComputedStyle | null | undefined
): CssSafeAreaInsets {
  return {
    coordinateSpace: 'css-pixels',
    left: parseCssPixelValue(computedStyle?.paddingLeft),
    right: parseCssPixelValue(computedStyle?.paddingRight),
    top: parseCssPixelValue(computedStyle?.paddingTop),
    bottom: parseCssPixelValue(computedStyle?.paddingBottom)
  };
}

export function readCssSafeAreaInsets(
  environment: CssSafeAreaReaderEnvironment = {}
): CssSafeAreaInsets {
  const documentSource = environment.document === undefined
    ? getBrowserDocument()
    : environment.document;
  const computedStyleReader = environment.getComputedStyle === undefined
    ? getBrowserComputedStyleReader()
    : environment.getComputedStyle;

  if (documentSource === null || computedStyleReader === null) {
    return zeroCssSafeAreaInsets();
  }

  let probe: CssSafeAreaProbeElement | null = null;

  try {
    const parent = documentSource.body ?? documentSource.documentElement;
    if (parent === null || parent === undefined) {
      return zeroCssSafeAreaInsets();
    }

    probe = documentSource.createElement('div');
    Object.assign(probe.style, {
      position: 'fixed',
      visibility: 'hidden',
      pointerEvents: 'none',
      width: '0',
      height: '0',
      paddingLeft: 'env(safe-area-inset-left, 0px)',
      paddingRight: 'env(safe-area-inset-right, 0px)',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    });
    parent.appendChild(probe);

    return parseCssSafeAreaInsets(computedStyleReader(probe));
  } catch {
    return zeroCssSafeAreaInsets();
  } finally {
    probe?.remove();
  }
}

export function calculateLogicalSafeArea(
  calculation: LogicalSafeAreaCalculation
): LogicalSafeAreaInsets {
  const {
    canvasRect,
    viewportWidth,
    viewportHeight,
    logicalWidth,
    logicalHeight
  } = calculation;

  if (
    !isPositiveFinite(canvasRect.width)
    || !isPositiveFinite(canvasRect.height)
    || !isFiniteNumber(canvasRect.left)
    || !isFiniteNumber(canvasRect.right)
    || !isFiniteNumber(canvasRect.top)
    || !isFiniteNumber(canvasRect.bottom)
    || !isPositiveFinite(viewportWidth)
    || !isPositiveFinite(viewportHeight)
    || !isPositiveFinite(logicalWidth)
    || !isPositiveFinite(logicalHeight)
  ) {
    return zeroLogicalSafeAreaInsets();
  }

  const cssInsets = sanitizeCssSafeAreaInsets(calculation.cssInsets);
  const safeViewportLeft = cssInsets.left;
  const safeViewportRight = viewportWidth - cssInsets.right;
  const safeViewportTop = cssInsets.top;
  const safeViewportBottom = viewportHeight - cssInsets.bottom;

  const leftOverlapCss = clamp(safeViewportLeft - canvasRect.left, 0, canvasRect.width);
  const rightOverlapCss = clamp(canvasRect.right - safeViewportRight, 0, canvasRect.width);
  const topOverlapCss = clamp(safeViewportTop - canvasRect.top, 0, canvasRect.height);
  const bottomOverlapCss = clamp(canvasRect.bottom - safeViewportBottom, 0, canvasRect.height);
  const logicalPerCssX = logicalWidth / canvasRect.width;
  const logicalPerCssY = logicalHeight / canvasRect.height;

  return {
    coordinateSpace: 'phaser-logical',
    left: finiteOrZero(leftOverlapCss * logicalPerCssX),
    right: finiteOrZero(rightOverlapCss * logicalPerCssX),
    top: finiteOrZero(topOverlapCss * logicalPerCssY),
    bottom: finiteOrZero(bottomOverlapCss * logicalPerCssY)
  };
}

export function getCurrentSafeAreaForGame(
  game: SafeAreaGame,
  runtime: SafeAreaRuntime = {}
): LogicalSafeAreaInsets {
  const runtimeWindow = resolveWindow(runtime.window);
  const logicalSize = readLogicalGameSize(game);

  if (game.canvas === null || game.canvas === undefined || runtimeWindow === null || logicalSize === null) {
    return zeroLogicalSafeAreaInsets();
  }

  try {
    const cssInsets = runtime.readCssInsets?.() ?? readCssSafeAreaInsets(runtime);

    return calculateLogicalSafeArea({
      cssInsets,
      canvasRect: game.canvas.getBoundingClientRect(),
      viewportWidth: runtimeWindow.innerWidth,
      viewportHeight: runtimeWindow.innerHeight,
      logicalWidth: logicalSize.width,
      logicalHeight: logicalSize.height
    });
  } catch {
    return zeroLogicalSafeAreaInsets();
  }
}

export function observeSafeAreaForGame(
  game: SafeAreaGame,
  subscriber: SafeAreaSubscriber,
  runtime: SafeAreaRuntime = {}
): SafeAreaSubscription {
  const runtimeWindow = resolveWindow(runtime.window);
  const screenOrientation = resolveScreenOrientation(runtime.screenOrientation);
  const visualViewport = resolveVisualViewport(runtime.visualViewport, runtimeWindow);
  const requestFrame = resolveRequestAnimationFrame(runtime.requestAnimationFrame, runtimeWindow);
  const cancelFrame = resolveCancelAnimationFrame(runtime.cancelAnimationFrame, runtimeWindow);
  let currentSnapshot = getCurrentSafeAreaForGame(game, runtime);
  let firstFrame: number | null = null;
  let secondFrame: number | null = null;
  let disposed = false;

  const publishIfChanged = (): void => {
    if (disposed) {
      return;
    }

    const nextSnapshot = getCurrentSafeAreaForGame(game, runtime);
    if (logicalSafeAreasEqual(currentSnapshot, nextSnapshot)) {
      return;
    }

    currentSnapshot = nextSnapshot;
    subscriber(nextSnapshot);
  };

  const scheduleUpdate = (): void => {
    if (disposed || firstFrame !== null || secondFrame !== null) {
      return;
    }

    if (requestFrame === null) {
      publishIfChanged();
      return;
    }

    firstFrame = requestFrame(() => {
      firstFrame = null;
      if (disposed) {
        return;
      }

      secondFrame = requestFrame(() => {
        secondFrame = null;
        publishIfChanged();
      });
    });
  };

  subscriber(currentSnapshot);

  const listeners: Array<readonly [SafeAreaEventTarget, string]> = [];
  addScopedListener(runtimeWindow, 'resize', scheduleUpdate, listeners);
  addScopedListener(runtimeWindow, 'orientationchange', scheduleUpdate, listeners);
  addScopedListener(screenOrientation, 'change', scheduleUpdate, listeners);
  addScopedListener(visualViewport, 'resize', scheduleUpdate, listeners);

  return {
    dispose: () => {
      if (disposed) {
        return;
      }

      disposed = true;
      for (const [target, eventName] of listeners) {
        target.removeEventListener(eventName, scheduleUpdate);
      }

      if (cancelFrame !== null) {
        if (firstFrame !== null) {
          cancelFrame(firstFrame);
        }
        if (secondFrame !== null) {
          cancelFrame(secondFrame);
        }
      }

      firstFrame = null;
      secondFrame = null;
    }
  };
}

function sanitizeCssSafeAreaInsets(insets: CssSafeAreaInsets): CssSafeAreaInsets {
  return {
    coordinateSpace: 'css-pixels',
    left: nonNegativeFiniteOrZero(insets.left),
    right: nonNegativeFiniteOrZero(insets.right),
    top: nonNegativeFiniteOrZero(insets.top),
    bottom: nonNegativeFiniteOrZero(insets.bottom)
  };
}

function readLogicalGameSize(game: SafeAreaGame): LogicalGameSize | null {
  const scaleSize = game.scale?.gameSize;
  if (scaleSize !== null && scaleSize !== undefined) {
    return scaleSize;
  }

  const configWidth = game.config?.width;
  const configHeight = game.config?.height;
  if (typeof configWidth !== 'number' || typeof configHeight !== 'number') {
    return null;
  }

  return { width: configWidth, height: configHeight };
}

function logicalSafeAreasEqual(
  first: LogicalSafeAreaInsets,
  second: LogicalSafeAreaInsets
): boolean {
  return Math.abs(first.left - second.left) <= SAFE_AREA_CHANGE_TOLERANCE
    && Math.abs(first.right - second.right) <= SAFE_AREA_CHANGE_TOLERANCE
    && Math.abs(first.top - second.top) <= SAFE_AREA_CHANGE_TOLERANCE
    && Math.abs(first.bottom - second.bottom) <= SAFE_AREA_CHANGE_TOLERANCE;
}

function addScopedListener(
  target: SafeAreaEventTarget | null,
  eventName: string,
  listener: () => void,
  listeners: Array<readonly [SafeAreaEventTarget, string]>
): void {
  if (target === null) {
    return;
  }

  target.addEventListener(eventName, listener);
  listeners.push([target, eventName]);
}

function resolveWindow(runtimeWindow: SafeAreaWindow | null | undefined): SafeAreaWindow | null {
  if (runtimeWindow !== undefined) {
    return runtimeWindow;
  }

  return typeof window === 'undefined' ? null : window;
}

function resolveScreenOrientation(
  runtimeOrientation: SafeAreaEventTarget | null | undefined
): SafeAreaEventTarget | null {
  if (runtimeOrientation !== undefined) {
    return runtimeOrientation;
  }

  return typeof screen === 'undefined' ? null : screen.orientation;
}

function resolveVisualViewport(
  runtimeViewport: SafeAreaVisualViewport | null | undefined,
  runtimeWindow: SafeAreaWindow | null
): SafeAreaVisualViewport | null {
  if (runtimeViewport !== undefined) {
    return runtimeViewport;
  }

  return runtimeWindow?.visualViewport ?? null;
}

function resolveRequestAnimationFrame(
  runtimeRequest: ((callback: FrameRequestCallback) => number) | null | undefined,
  runtimeWindow: SafeAreaWindow | null
): ((callback: FrameRequestCallback) => number) | null {
  if (runtimeRequest !== undefined) {
    return runtimeRequest;
  }

  return runtimeWindow?.requestAnimationFrame?.bind(runtimeWindow) ?? null;
}

function resolveCancelAnimationFrame(
  runtimeCancel: ((handle: number) => void) | null | undefined,
  runtimeWindow: SafeAreaWindow | null
): ((handle: number) => void) | null {
  if (runtimeCancel !== undefined) {
    return runtimeCancel;
  }

  return runtimeWindow?.cancelAnimationFrame?.bind(runtimeWindow) ?? null;
}

function getBrowserDocument(): CssSafeAreaDocument | null {
  return typeof document === 'undefined'
    ? null
    : document as unknown as CssSafeAreaDocument;
}

function getBrowserComputedStyleReader(): ((element: CssSafeAreaProbeElement) => CssSafeAreaComputedStyle) | null {
  if (typeof getComputedStyle === 'undefined') {
    return null;
  }

  return (element) => getComputedStyle(element as unknown as Element);
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function nonNegativeFiniteOrZero(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
