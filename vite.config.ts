import { defineConfig } from 'vitest/config';
import { createKitRegistrySyncPlugin } from './scripts/vite-kit-registry-plugin';

export default defineConfig({
  plugins: [
    createKitRegistrySyncPlugin()
  ],
  server: {
    open: false
  },
  test: {
    environment: 'node'
  }
});
