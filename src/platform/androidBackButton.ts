import { App } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';

export interface AndroidBackButtonRuntime {
  isNativePlatform(): boolean;
  getPlatform(): string;
  addBackButtonListener(listener: () => void): Promise<PluginListenerHandle>;
  toggleBackButtonHandler(enabled: boolean): Promise<void>;
}

export interface AndroidBackButtonSubscription {
  remove(): void;
}

export interface AndroidMatchBackHandler {
  canHandleBack(): boolean;
  isPauseOpen(): boolean;
  canOpenPause(): boolean;
  openPause(): void;
  closePause(): void;
}

const capacitorAndroidBackButtonRuntime: AndroidBackButtonRuntime = {
  isNativePlatform: () => Capacitor.isNativePlatform(),
  getPlatform: () => Capacitor.getPlatform(),
  addBackButtonListener: (listener) => App.addListener('backButton', listener),
  toggleBackButtonHandler: (enabled) => App.toggleBackButtonHandler({ enabled })
};

export interface AndroidBackButtonManager {
  register(listener: () => void): AndroidBackButtonSubscription;
}

export function createAndroidBackButtonManager(runtime: AndroidBackButtonRuntime): AndroidBackButtonManager {
  let currentOwner: symbol | null = null;
  let removeCurrentSubscription: (() => void) | null = null;
  let nativeHandlerTransition = Promise.resolve();

  const queueNativeHandlerState = (owner: symbol | null, enabled: boolean): void => {
    nativeHandlerTransition = nativeHandlerTransition
      .catch(() => undefined)
      .then(() => {
        if (currentOwner !== owner) {
          return;
        }

        return runtime.toggleBackButtonHandler(enabled);
      })
      .catch(() => undefined);
  };

  return {
    register: (listener) => {
      let isRemoved = false;
      let listenerHandle: PluginListenerHandle | null = null;

      if (!runtime.isNativePlatform() || runtime.getPlatform() !== 'android') {
        return {
          remove: () => {
            isRemoved = true;
          }
        };
      }

      removeCurrentSubscription?.();

      const owner = Symbol('android-back-button-owner');
      currentOwner = owner;
      queueNativeHandlerState(owner, true);

      void runtime
        .addBackButtonListener(() => {
          if (!isRemoved && currentOwner === owner) {
            listener();
          }
        })
        .then((registeredHandle) => {
          if (isRemoved || currentOwner !== owner) {
            removeListenerHandle(registeredHandle);
            return;
          }

          listenerHandle = registeredHandle;
        })
        .catch(() => undefined);

      const remove = (): void => {
        if (isRemoved) {
          return;
        }

        isRemoved = true;
        const registeredHandle = listenerHandle;
        listenerHandle = null;

        if (registeredHandle !== null) {
          removeListenerHandle(registeredHandle);
        }

        if (currentOwner === owner) {
          currentOwner = null;
          removeCurrentSubscription = null;
          queueNativeHandlerState(null, false);
        }
      };

      removeCurrentSubscription = remove;
      return { remove };
    }
  };
}

const androidBackButtonManager = createAndroidBackButtonManager(capacitorAndroidBackButtonRuntime);

export function registerAndroidBackButtonListener(
  listener: () => void
): AndroidBackButtonSubscription {
  return androidBackButtonManager.register(listener);
}

export function handleAndroidMatchBackButton(handler: AndroidMatchBackHandler): void {
  if (!handler.canHandleBack()) {
    return;
  }

  if (handler.isPauseOpen()) {
    handler.closePause();
    return;
  }

  if (handler.canOpenPause()) {
    handler.openPause();
  }
}

function removeListenerHandle(listenerHandle: PluginListenerHandle): void {
  void listenerHandle.remove().catch(() => undefined);
}
