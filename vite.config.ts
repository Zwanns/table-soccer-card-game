import { defineConfig } from 'vitest/config';
import { createKitRegistrySyncPlugin } from './scripts/vite-kit-registry-plugin';
import { createLogoRegistrySyncPlugin } from './scripts/vite-logo-registry-plugin';

export default defineConfig({
  plugins: [
    createKitRegistrySyncPlugin(),
    createLogoRegistrySyncPlugin()
  ],
  server: {
    open: false
  },
  test: {
    environment: 'node'
  }
});
