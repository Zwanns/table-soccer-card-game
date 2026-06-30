import { join } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { GENERATED_KIT_REGISTRY_PATH, syncKitRegistry } from './sync-kit-registry';

const KIT_IMAGE_GLOB = 'public/kits/images/*.webp';
const KIT_IMAGE_PATH_MARKER = '/public/kits/images/';
const KIT_IMAGE_EXTENSION = '.webp';
const SYNC_DEBOUNCE_MS = 100;

export function createKitRegistrySyncPlugin(): Plugin {
  let projectRoot = process.cwd();
  let syncTimer: ReturnType<typeof setTimeout> | undefined;

  function syncRegistry(): void {
    const result = syncKitRegistry({
      projectRoot
    });

    console.info(
      `[kit-registry] Synced ${GENERATED_KIT_REGISTRY_PATH} with ${result.flagCodes.length} team kit flag code(s).`
    );
  }

  function scheduleDevSync(server: ViteDevServer): void {
    if (syncTimer !== undefined) {
      clearTimeout(syncTimer);
    }

    syncTimer = setTimeout(() => {
      syncTimer = undefined;

      try {
        syncRegistry();
        server.ws.send({ type: 'full-reload' });
      } catch (error: unknown) {
        server.config.logger.error(`[kit-registry] ${formatError(error)}`);
      }
    }, SYNC_DEBOUNCE_MS);
  }

  return {
    name: 'total-soccer-kit-registry-sync',
    apply(_config, environment) {
      return environment.command === 'serve' || environment.command === 'build';
    },
    configResolved(config) {
      projectRoot = config.root;
      syncRegistry();
    },
    configureServer(server) {
      server.watcher.add(join(projectRoot, KIT_IMAGE_GLOB));

      const handleKitFileEvent = (filePath: string): void => {
        if (isKitImagePath(filePath)) {
          scheduleDevSync(server);
        }
      };

      server.watcher.on('add', handleKitFileEvent);
      server.watcher.on('change', handleKitFileEvent);
      server.watcher.on('unlink', handleKitFileEvent);
    }
  };
}

function isKitImagePath(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');

  return normalizedPath.includes(KIT_IMAGE_PATH_MARKER) && normalizedPath.endsWith(KIT_IMAGE_EXTENSION);
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
