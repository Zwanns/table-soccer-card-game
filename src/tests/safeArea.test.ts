import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  calculateLogicalSafeArea,
  getCurrentSafeAreaForGame,
  observeSafeAreaForGame,
  parseCssPixelValue,
  parseCssSafeAreaInsets,
  readCssSafeAreaInsets,
  type CssSafeAreaInsets,
  type SafeAreaCanvasRect,
  type SafeAreaEventTarget,
  type SafeAreaGame,
  type SafeAreaRuntime,
  type SafeAreaVisualViewport,
  type SafeAreaWindow
} from '../platform/safeArea';

function cssInsets(
  left = 0,
  right = 0,
  top = 0,
  bottom = 0
): CssSafeAreaInsets {
  return {
    coordinateSpace: 'css-pixels',
    left,
    right,
    top,
    bottom
  };
}

function canvasRect(
  left: number,
  top: number,
  width: number,
  height: number
): SafeAreaCanvasRect {
  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height
  };
}

function calculate(options: {
  insets?: CssSafeAreaInsets;
  rect?: SafeAreaCanvasRect;
  viewportWidth?: number;
  viewportHeight?: number;
  logicalWidth?: number;
  logicalHeight?: number;
} = {}) {
  return calculateLogicalSafeArea({
    cssInsets: options.insets ?? cssInsets(),
    canvasRect: options.rect ?? canvasRect(0, 0, 800, 400),
    viewportWidth: options.viewportWidth ?? 800,
    viewportHeight: options.viewportHeight ?? 400,
    logicalWidth: options.logicalWidth ?? 1600,
    logicalHeight: options.logicalHeight ?? 720
  });
}

function expectZeroInsets(insets: ReturnType<typeof calculate>): void {
  expect(insets).toEqual({
    coordinateSpace: 'phaser-logical',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  });
}

describe('safe-area pure geometry', () => {
  it('returns zero logical overlap for zero CSS insets', () => {
    expectZeroInsets(calculate());
  });

  it('converts the test-device left inset using the actual canvas width', () => {
    const result = calculate({
      insets: cssInsets(51),
      rect: canvasRect(0, 0, 914.286, 411.429),
      viewportWidth: 914.286,
      viewportHeight: 411.429
    });

    expect(result.left).toBeCloseTo(89.25, 2);
    expect(result.right).toBe(0);
  });

  it('converts the test-device right inset using the actual canvas width', () => {
    const result = calculate({
      insets: cssInsets(0, 51),
      rect: canvasRect(0, 0, 914.286, 411.429),
      viewportWidth: 914.286,
      viewportHeight: 411.429
    });

    expect(result.right).toBeCloseTo(89.25, 2);
    expect(result.left).toBe(0);
  });

  it('returns zero left overlap when letterboxing starts the canvas after the safe boundary', () => {
    const result = calculate({
      insets: cssInsets(50),
      rect: canvasRect(70, 0, 100, 100),
      viewportWidth: 200,
      viewportHeight: 100,
      logicalWidth: 200,
      logicalHeight: 100
    });

    expect(result.left).toBe(0);
  });

  it('converts only the partial left overlap', () => {
    const result = calculate({
      insets: cssInsets(50),
      rect: canvasRect(30, 0, 100, 100),
      viewportWidth: 200,
      viewportHeight: 100,
      logicalWidth: 200,
      logicalHeight: 100
    });

    expect(result.left).toBe(40);
  });

  it('returns zero right overlap when the unsafe zone is outside a letterboxed canvas', () => {
    const result = calculate({
      insets: cssInsets(0, 50),
      rect: canvasRect(30, 0, 100, 100),
      viewportWidth: 200,
      viewportHeight: 100,
      logicalWidth: 200,
      logicalHeight: 100
    });

    expect(result.right).toBe(0);
  });

  it('converts only the partial right overlap', () => {
    const result = calculate({
      insets: cssInsets(0, 50),
      rect: canvasRect(70, 0, 100, 100),
      viewportWidth: 200,
      viewportHeight: 100,
      logicalWidth: 200,
      logicalHeight: 100
    });

    expect(result.right).toBe(40);
  });

  it('calculates top overlap against the canvas top edge', () => {
    const result = calculate({
      insets: cssInsets(0, 0, 50),
      rect: canvasRect(0, 30, 100, 100),
      viewportWidth: 100,
      viewportHeight: 200,
      logicalWidth: 100,
      logicalHeight: 300
    });

    expect(result.top).toBe(60);
  });

  it('calculates bottom overlap against the canvas bottom edge', () => {
    const result = calculate({
      insets: cssInsets(0, 0, 0, 50),
      rect: canvasRect(0, 70, 100, 100),
      viewportWidth: 100,
      viewportHeight: 200,
      logicalWidth: 100,
      logicalHeight: 300
    });

    expect(result.bottom).toBe(60);
  });

  it('preserves asymmetric insets on all four sides', () => {
    const result = calculate({
      insets: cssInsets(10, 20, 30, 40),
      rect: canvasRect(0, 0, 400, 300),
      viewportWidth: 400,
      viewportHeight: 300,
      logicalWidth: 800,
      logicalHeight: 600
    });

    expect(result).toEqual({
      coordinateSpace: 'phaser-logical',
      left: 20,
      right: 40,
      top: 60,
      bottom: 80
    });
  });

  it('uses independent horizontal and vertical CSS-to-logical scales', () => {
    const result = calculate({
      insets: cssInsets(10, 10, 10, 10),
      rect: canvasRect(0, 0, 800, 400),
      viewportWidth: 800,
      viewportHeight: 400,
      logicalWidth: 1600,
      logicalHeight: 600
    });

    expect(result.left).toBe(20);
    expect(result.right).toBe(20);
    expect(result.top).toBe(15);
    expect(result.bottom).toBe(15);
  });

  it('fails safe for invalid dimensions without NaN or Infinity', () => {
    const invalidCalculations = [
      calculate({ rect: canvasRect(0, 0, 0, 400) }),
      calculate({ rect: canvasRect(0, 0, 800, 0) }),
      calculate({ rect: canvasRect(Number.NaN, 0, 800, 400) }),
      calculate({ viewportWidth: 0 }),
      calculate({ viewportHeight: Number.POSITIVE_INFINITY }),
      calculate({ logicalWidth: 0 }),
      calculate({ logicalHeight: Number.NaN })
    ];

    for (const result of invalidCalculations) {
      expectZeroInsets(result);
      expect(Object.values(result).filter((value): value is number => typeof value === 'number'))
        .toSatisfy((values: number[]) => values.every(Number.isFinite));
    }
  });
});

describe('safe-area CSS env reader', () => {
  it('parses finite CSS pixel values and rejects unsupported or unsafe values', () => {
    expect(parseCssPixelValue(' 12.5px ')).toBe(12.5);
    expect(parseCssPixelValue('0px')).toBe(0);
    expect(parseCssPixelValue('-4px')).toBe(0);
    expect(parseCssPixelValue('2rem')).toBe(0);
    expect(parseCssPixelValue('env(safe-area-inset-left)')).toBe(0);
    expect(parseCssPixelValue(undefined)).toBe(0);
  });

  it('maps mocked computed paddings into explicitly CSS-pixel insets', () => {
    expect(parseCssSafeAreaInsets({
      paddingLeft: '10.25px',
      paddingRight: '20px',
      paddingTop: '3.5px',
      paddingBottom: '0px'
    })).toEqual(cssInsets(10.25, 20, 3.5, 0));
  });

  it('reads env paddings through a temporary DOM probe and removes its owned probe', () => {
    const probe = { style: {}, remove: vi.fn() };
    const appendChild = vi.fn();
    const createElement = vi.fn(() => probe);
    const getComputedStyle = vi.fn(() => ({
      paddingLeft: '7px',
      paddingRight: '8px',
      paddingTop: '9px',
      paddingBottom: '10px'
    }));

    const result = readCssSafeAreaInsets({
      document: { body: { appendChild }, createElement },
      getComputedStyle
    });

    expect(result).toEqual(cssInsets(7, 8, 9, 10));
    expect(createElement).toHaveBeenCalledWith('div');
    expect(appendChild).toHaveBeenCalledWith(probe);
    expect(probe.style).toMatchObject({
      paddingLeft: 'env(safe-area-inset-left, 0px)',
      paddingRight: 'env(safe-area-inset-right, 0px)',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    });
    expect(probe.remove).toHaveBeenCalledOnce();
  });

  it('returns zeros when DOM APIs are unavailable', () => {
    expect(readCssSafeAreaInsets({ document: null, getComputedStyle: null })).toEqual(cssInsets());
  });

  it('returns zeros and removes the probe when computed-style reading fails', () => {
    const probe = { style: {}, remove: vi.fn() };

    expect(readCssSafeAreaInsets({
      document: {
        body: { appendChild: vi.fn() },
        createElement: () => probe
      },
      getComputedStyle: () => {
        throw new Error('computed style unavailable');
      }
    })).toEqual(cssInsets());
    expect(probe.remove).toHaveBeenCalledOnce();
  });
});

class TestEventTarget implements SafeAreaEventTarget {
  private readonly listeners = new Map<string, Set<() => void>>();

  addEventListener(type: string, listener: () => void): void {
    const eventListeners = this.listeners.get(type) ?? new Set<() => void>();
    eventListeners.add(listener);
    this.listeners.set(type, eventListeners);
  }

  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener();
    }
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }
}

class TestWindow extends TestEventTarget implements SafeAreaWindow {
  innerWidth = 800;
  innerHeight = 400;
  visualViewport: SafeAreaVisualViewport | null = null;
}

class TestAnimationFrames {
  private nextHandle = 1;
  private readonly callbacks = new Map<number, FrameRequestCallback>();

  readonly request = vi.fn((callback: FrameRequestCallback): number => {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.callbacks.set(handle, callback);
    return handle;
  });

  readonly cancel = vi.fn((handle: number): void => {
    this.callbacks.delete(handle);
  });

  flushFrame(): void {
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const callback of callbacks) {
      callback(0);
    }
  }

  flushChain(): void {
    this.flushFrame();
    this.flushFrame();
  }
}

function createObserverFixture() {
  const runtimeWindow = new TestWindow();
  const screenOrientation = new TestEventTarget();
  const visualViewport = new TestEventTarget();
  const animationFrames = new TestAnimationFrames();
  let currentInsets = cssInsets();
  let currentRect = canvasRect(0, 0, 800, 400);
  const getBoundingClientRect = vi.fn(() => currentRect);
  const game: SafeAreaGame = {
    canvas: { getBoundingClientRect },
    scale: { gameSize: { width: 1600, height: 720 } }
  };
  const runtime: SafeAreaRuntime = {
    window: runtimeWindow,
    screenOrientation,
    visualViewport,
    requestAnimationFrame: animationFrames.request,
    cancelAnimationFrame: animationFrames.cancel,
    readCssInsets: () => currentInsets
  };

  return {
    runtimeWindow,
    screenOrientation,
    visualViewport,
    animationFrames,
    game,
    runtime,
    getBoundingClientRect,
    setInsets: (insets: CssSafeAreaInsets) => {
      currentInsets = insets;
    },
    setRect: (rect: SafeAreaCanvasRect) => {
      currentRect = rect;
    }
  };
}

describe('safe-area snapshot and observer lifecycle', () => {
  it('provides an initial snapshot from the current game geometry', () => {
    const fixture = createObserverFixture();
    fixture.setInsets(cssInsets(20));

    expect(getCurrentSafeAreaForGame(fixture.game, fixture.runtime).left).toBe(40);

    const subscriber = vi.fn();
    const subscription = observeSafeAreaForGame(fixture.game, subscriber, fixture.runtime);
    expect(subscriber).toHaveBeenCalledOnce();
    expect(subscriber.mock.calls[0][0].left).toBe(40);
    subscription.dispose();
  });

  it('recalculates after resize but suppresses an identical snapshot callback', () => {
    const fixture = createObserverFixture();
    const subscriber = vi.fn();
    const subscription = observeSafeAreaForGame(fixture.game, subscriber, fixture.runtime);
    const readsAfterInitialSnapshot = fixture.getBoundingClientRect.mock.calls.length;

    fixture.runtimeWindow.dispatch('resize');
    fixture.animationFrames.flushChain();

    expect(fixture.getBoundingClientRect.mock.calls.length).toBeGreaterThan(readsAfterInitialSnapshot);
    expect(subscriber).toHaveBeenCalledOnce();
    subscription.dispose();
  });

  it('publishes changed left and right values after a window orientation event', () => {
    const fixture = createObserverFixture();
    fixture.setInsets(cssInsets(30));
    const subscriber = vi.fn();
    const subscription = observeSafeAreaForGame(fixture.game, subscriber, fixture.runtime);

    fixture.setInsets(cssInsets(0, 30));
    fixture.runtimeWindow.dispatch('orientationchange');
    fixture.animationFrames.flushChain();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber.mock.calls[1][0]).toMatchObject({ left: 0, right: 60 });
    subscription.dispose();
  });

  it('reacts to screen.orientation change', () => {
    const fixture = createObserverFixture();
    const subscriber = vi.fn();
    const subscription = observeSafeAreaForGame(fixture.game, subscriber, fixture.runtime);

    fixture.setInsets(cssInsets(12));
    fixture.screenOrientation.dispatch('change');
    fixture.animationFrames.flushChain();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber.mock.calls[1][0].left).toBe(24);
    subscription.dispose();
  });

  it('reacts to visualViewport resize when that API is available', () => {
    const fixture = createObserverFixture();
    const subscriber = vi.fn();
    const subscription = observeSafeAreaForGame(fixture.game, subscriber, fixture.runtime);

    fixture.setRect(canvasRect(10, 0, 780, 400));
    fixture.setInsets(cssInsets(20));
    fixture.visualViewport.dispatch('resize');
    fixture.animationFrames.flushChain();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber.mock.calls[1][0].left).toBeCloseTo(20.5128, 3);
    subscription.dispose();
  });

  it('coalesces a burst of rotation-related events into one recalculation', () => {
    const fixture = createObserverFixture();
    const subscriber = vi.fn();
    const subscription = observeSafeAreaForGame(fixture.game, subscriber, fixture.runtime);
    const readsAfterInitialSnapshot = fixture.getBoundingClientRect.mock.calls.length;

    fixture.setInsets(cssInsets(10));
    fixture.runtimeWindow.dispatch('resize');
    fixture.runtimeWindow.dispatch('orientationchange');
    fixture.screenOrientation.dispatch('change');
    fixture.visualViewport.dispatch('resize');
    fixture.animationFrames.flushChain();

    expect(fixture.getBoundingClientRect.mock.calls.length).toBe(readsAfterInitialSnapshot + 1);
    expect(subscriber).toHaveBeenCalledTimes(2);
    subscription.dispose();
  });

  it('dispose removes only the observer own event listeners', () => {
    const fixture = createObserverFixture();
    const subscription = observeSafeAreaForGame(fixture.game, vi.fn(), fixture.runtime);

    expect(fixture.runtimeWindow.listenerCount('resize')).toBe(1);
    expect(fixture.runtimeWindow.listenerCount('orientationchange')).toBe(1);
    expect(fixture.screenOrientation.listenerCount('change')).toBe(1);
    expect(fixture.visualViewport.listenerCount('resize')).toBe(1);

    subscription.dispose();

    expect(fixture.runtimeWindow.listenerCount('resize')).toBe(0);
    expect(fixture.runtimeWindow.listenerCount('orientationchange')).toBe(0);
    expect(fixture.screenOrientation.listenerCount('change')).toBe(0);
    expect(fixture.visualViewport.listenerCount('resize')).toBe(0);
  });

  it('does not publish from a pending RAF chain after dispose', () => {
    const fixture = createObserverFixture();
    const subscriber = vi.fn();
    const subscription = observeSafeAreaForGame(fixture.game, subscriber, {
      ...fixture.runtime,
      cancelAnimationFrame: () => undefined
    });

    fixture.setInsets(cssInsets(10));
    fixture.runtimeWindow.dispatch('resize');
    subscription.dispose();
    fixture.animationFrames.flushChain();

    expect(subscriber).toHaveBeenCalledOnce();
  });

  it('does not accumulate subscriptions across repeated observer lifecycles', () => {
    const fixture = createObserverFixture();

    for (let index = 0; index < 3; index += 1) {
      observeSafeAreaForGame(fixture.game, vi.fn(), fixture.runtime).dispose();
      expect(fixture.runtimeWindow.listenerCount('resize')).toBe(0);
      expect(fixture.screenOrientation.listenerCount('change')).toBe(0);
      expect(fixture.visualViewport.listenerCount('resize')).toBe(0);
    }

    const activeSubscriber = vi.fn();
    const activeSubscription = observeSafeAreaForGame(fixture.game, activeSubscriber, fixture.runtime);
    fixture.setInsets(cssInsets(10));
    fixture.runtimeWindow.dispatch('resize');
    fixture.animationFrames.flushChain();

    expect(activeSubscriber).toHaveBeenCalledTimes(2);
    activeSubscription.dispose();
  });

  it('keeps the production foundation platform-neutral and free of polling or import wiring', () => {
    const source = readFileSync(join(process.cwd(), 'src/platform/safeArea.ts'), 'utf8');
    const mainSource = readFileSync(join(process.cwd(), 'src/main.ts'), 'utf8');

    expect(source).not.toContain('@capacitor');
    expect(source).not.toContain('setInterval');
    expect(source).not.toContain('setTimeout');
    expect(source).not.toContain('removeAllListeners');
    expect(mainSource).not.toContain("from './platform/safeArea'");
  });
});
