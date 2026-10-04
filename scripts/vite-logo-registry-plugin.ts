import { join } from 'node:path';
import type { Plugin } from 'vite';
import { syncLogoRegistry } from './sync-logo-registry';

export function createLogoRegistrySyncPlugin(): Plugin {
  let projectRoot = process.cwd();
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    name: 'total-soccer-logo-registry-sync',
    configResolved(config) {
      projectRoot = config.root;
      const result = syncLogoRegistry({ projectRoot });
      console.info(`[logo-registry] Synced ${result.flagCodes.length} team logos.`);
    },
    configureServer(server) {
      server.watcher.add(join(projectRoot, 'public', 'logos'));
      const onLogoChange = (filePath: string): void => {
        const path = filePath.replace(/\\/g, '/');
        if (!path.includes('/public/logos/') || path.endsWith('/README.md')) return;
        if (timer !== undefined) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = undefined;
          try {
            syncLogoRegistry({ projectRoot });
            server.ws.send({ type: 'full-reload' });
          } catch (error) {
            server.config.logger.error(`[logo-registry] ${error instanceof Error ? error.message : String(error)}`);
          }
        }, 100);
      };
      server.watcher.on('add', onLogoChange);
      server.watcher.on('change', onLogoChange);
      server.watcher.on('unlink', onLogoChange);
      server.httpServer?.once('close', () => { if (timer !== undefined) clearTimeout(timer); });
    }
  };
}
