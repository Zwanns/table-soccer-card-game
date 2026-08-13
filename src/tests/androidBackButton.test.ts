import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PluginListenerHandle } from '@capacitor/core';
import { describe, expect, it, vi } from 'vitest';
import {
  createAndroidBackButtonManager,
  handleAndroidMatchBackButton,
  type AndroidBackButtonRuntime,
  type AndroidMatchBackHandler
} from '../platform/androidBackButton';

function createListenerHandle(): PluginListenerHandle & { remove: ReturnType<typeof vi.fn> } {
  return {
    remove: vi.fn().mockResolvedValue(undefined)
  };
}

type TestAndroidBackButtonRuntime = AndroidBackButtonRuntime & {
  addBackButtonListener: ReturnType<typeof vi.fn>;
  toggleBackButtonHandler: ReturnType<typeof vi.fn>;
};

function createRuntime(options: {
  native?: boolean;
  platform?: string;
  registration?: Promise<PluginListenerHandle>;
  toggleBackButtonHandler?: (enabled: boolean) => Promise<void>;
} = {}): TestAndroidBackButtonRuntime {
  const registration = options.registration ?? Promise.resolve(createListenerHandle());

  return {
    isNativePlatform: () => options.native ?? true,
    getPlatform: () => options.platform ?? 'android',
    addBackButtonListener: vi.fn().mockReturnValue(registration),
    toggleBackButtonHandler: vi.fn(options.toggleBackButtonHandler ?? (() => Promise.resolve()))
  };
}

async function flushPromises(): Promise<void> {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve();
  }
}

function createMatchBackHandler(overrides: Partial<AndroidMatchBackHandler> = {}): AndroidMatchBackHandler {
  return {
    canHandleBack: () => true,
    isPauseOpen: () => false,
    canOpenPause: () => true,
    openPause: vi.fn(),
    closePause: vi.fn(),
    ...overrides
  };
}

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('Android backButton listener lifecycle', () => {
  it('registers the listener for native Android', async () => {
    const runtime = createRuntime();
    const manager = createAndroidBackButtonManager(runtime);

    manager.register(vi.fn());
    await flushPromises();

    expect(runtime.addBackButtonListener).toHaveBeenCalledOnce();
    expect(runtime.toggleBackButtonHandler).toHaveBeenCalledWith(true);
  });

  it('does not register or toggle the native handler for web', () => {
    const runtime = createRuntime({ native: false, platform: 'web' });

    createAndroidBackButtonManager(runtime).register(vi.fn());

    expect(runtime.addBackButtonListener).not.toHaveBeenCalled();
    expect(runtime.toggleBackButtonHandler).not.toHaveBeenCalled();
  });

  it('does not register or toggle the native handler for a non-Android native platform', () => {
    const runtime = createRuntime({ platform: 'ios' });

    createAndroidBackButtonManager(runtime).register(vi.fn());

    expect(runtime.addBackButtonListener).not.toHaveBeenCalled();
    expect(runtime.toggleBackButtonHandler).not.toHaveBeenCalled();
  });

  it('removes only its scoped listener and restores the Android default handler during cleanup', async () => {
    const listenerHandle = createListenerHandle();
    const runtime = createRuntime({ registration: Promise.resolve(listenerHandle) });
    const subscription = createAndroidBackButtonManager(runtime).register(vi.fn());
    await flushPromises();

    subscription.remove();
    await flushPromises();

    expect(listenerHandle.remove).toHaveBeenCalledOnce();
    expect(runtime.toggleBackButtonHandler).toHaveBeenNthCalledWith(1, true);
    expect(runtime.toggleBackButtonHandler).toHaveBeenNthCalledWith(2, false);
  });

  it('removes a late listener handle and restores the default handler after cleanup', async () => {
    let resolveRegistration: ((handle: PluginListenerHandle) => void) | undefined;
    const registration = new Promise<PluginListenerHandle>((resolve) => {
      resolveRegistration = resolve;
    });
    const listenerHandle = createListenerHandle();
    const runtime = createRuntime({ registration });
    const subscription = createAndroidBackButtonManager(runtime).register(vi.fn());

    subscription.remove();
    resolveRegistration?.(listenerHandle);
    await registration;
    await flushPromises();

    expect(listenerHandle.remove).toHaveBeenCalledOnce();
    expect(runtime.toggleBackButtonHandler).toHaveBeenLastCalledWith(false);
  });

  it('ignores a stale callback after cleanup while registration is pending', () => {
    let registeredCallback: (() => void) | undefined;
    const listener = vi.fn();
    const runtime = createRuntime({ registration: new Promise<PluginListenerHandle>(() => undefined) });
    runtime.addBackButtonListener.mockImplementation((callback: () => void) => {
      registeredCallback = callback;
      return new Promise<PluginListenerHandle>(() => undefined);
    });
    const subscription = createAndroidBackButtonManager(runtime).register(listener);

    subscription.remove();
    registeredCallback?.();

    expect(listener).not.toHaveBeenCalled();
  });

  it('re-entering GameScene removes the previous scoped listener instead of accumulating listeners', async () => {
    const firstHandle = createListenerHandle();
    const secondHandle = createListenerHandle();
    const runtime = createRuntime();
    runtime.addBackButtonListener
      .mockResolvedValueOnce(firstHandle)
      .mockResolvedValueOnce(secondHandle);
    const manager = createAndroidBackButtonManager(runtime);

    manager.register(vi.fn());
    await flushPromises();
    manager.register(vi.fn());
    await flushPromises();

    expect(firstHandle.remove).toHaveBeenCalledOnce();
    expect(secondHandle.remove).not.toHaveBeenCalled();
    expect(runtime.addBackButtonListener).toHaveBeenCalledTimes(2);
  });

  it('does not let an old cleanup restore default Back over a newer active owner', async () => {
    let resolveFirstToggle: (() => void) | undefined;
    const firstToggle = new Promise<void>((resolve) => {
      resolveFirstToggle = resolve;
    });
    const runtime = createRuntime({
      toggleBackButtonHandler: vi.fn()
        .mockReturnValueOnce(firstToggle)
        .mockResolvedValue(undefined)
    });
    const manager = createAndroidBackButtonManager(runtime);
    const firstSubscription = manager.register(vi.fn());
    await flushPromises();

    firstSubscription.remove();
    const secondSubscription = manager.register(vi.fn());
    resolveFirstToggle?.();
    await flushPromises();

    expect(runtime.toggleBackButtonHandler).toHaveBeenCalledTimes(2);
    expect(runtime.toggleBackButtonHandler).toHaveBeenNthCalledWith(1, true);
    expect(runtime.toggleBackButtonHandler).toHaveBeenNthCalledWith(2, true);
    expect(runtime.toggleBackButtonHandler).not.toHaveBeenCalledWith(false);

    secondSubscription.remove();
    await flushPromises();

    expect(runtime.toggleBackButtonHandler).toHaveBeenNthCalledWith(3, false);
  });
});

describe('Android Back match Pause integration', () => {
  it('opens the existing Pause flow when Pause is closed', () => {
    const handler = createMatchBackHandler();

    handleAndroidMatchBackButton(handler);

    expect(handler.openPause).toHaveBeenCalledOnce();
    expect(handler.closePause).not.toHaveBeenCalled();
  });

  it('closes the existing Pause flow when Pause is open', () => {
    const handler = createMatchBackHandler({ isPauseOpen: () => true });

    handleAndroidMatchBackButton(handler);

    expect(handler.closePause).toHaveBeenCalledOnce();
    expect(handler.openPause).not.toHaveBeenCalled();
  });

  it('toggles Pause without creating duplicate overlays on repeated Back presses', () => {
    let isPauseOpen = false;
    const openPause = vi.fn(() => {
      isPauseOpen = true;
    });
    const closePause = vi.fn(() => {
      isPauseOpen = false;
    });
    const handler = createMatchBackHandler({ isPauseOpen: () => isPauseOpen, openPause, closePause });

    handleAndroidMatchBackButton(handler);
    handleAndroidMatchBackButton(handler);

    expect(openPause).toHaveBeenCalledOnce();
    expect(closePause).toHaveBeenCalledOnce();
  });

  it('does not open Pause when the existing Pause eligibility contract rejects it', () => {
    const handler = createMatchBackHandler({ canOpenPause: () => false });

    handleAndroidMatchBackButton(handler);

    expect(handler.openPause).not.toHaveBeenCalled();
    expect(handler.closePause).not.toHaveBeenCalled();
  });

  it('does nothing after GameScene shutdown or navigation begins', () => {
    const handler = createMatchBackHandler({ canHandleBack: () => false, isPauseOpen: () => true });

    handleAndroidMatchBackButton(handler);

    expect(handler.openPause).not.toHaveBeenCalled();
    expect(handler.closePause).not.toHaveBeenCalled();
  });

  it('keeps registration scoped to GameScene for both quick and tournament matches', () => {
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const menuSceneSource = readSource('src/scenes/MenuScene.ts');
    const mainSource = readSource('src/main.ts');
    const registrationBlock = gameSceneSource.slice(
      gameSceneSource.indexOf('private registerAndroidBackButtonListener()'),
      gameSceneSource.indexOf('private removeAndroidBackButtonListener()')
    );
    const shutdownBlock = gameSceneSource.slice(
      gameSceneSource.indexOf('private handleSceneShutdown()'),
      gameSceneSource.indexOf('private getPendingRestoreAnimationEntries(')
    );

    expect(gameSceneSource).toContain('this.registerAndroidBackButtonListener();');
    expect(registrationBlock).toContain('this.removeAndroidBackButtonListener();');
    expect(shutdownBlock).toContain('this.removeAndroidBackButtonListener();');
    expect(registrationBlock).not.toContain('launchContext');
    expect(registrationBlock).not.toContain('matchMode');
    expect(menuSceneSource).not.toContain('registerAndroidBackButtonListener');
    expect(mainSource).not.toContain('registerAndroidBackButtonListener');
  });

  it('uses GameScene Pause methods and never exits or minimizes the app', () => {
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const androidBackSource = readSource('src/platform/androidBackButton.ts');

    expect(gameSceneSource).toContain('canOpenPause: () => this.engine !== null && this.canOpenPauseModal()');
    expect(gameSceneSource).toContain('this.openPauseModal(this.engine.getState());');
    expect(gameSceneSource).toContain('closePause: () => this.closePauseModal()');
    expect(gameSceneSource).toContain('this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);');
    expect(gameSceneSource).not.toContain('App.exitApp');
    expect(gameSceneSource).not.toContain('App.minimizeApp');
    expect(androidBackSource).not.toContain('removeAllListeners');
    expect(androidBackSource).not.toContain('App.exitApp');
    expect(androidBackSource).not.toContain('App.minimizeApp');
  });
});
