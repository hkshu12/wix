import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8')) as { version: string };

export default defineConfig({
  resolve: {
    alias: {
      'virtual:pwa-register/react': path.join(rootDir, 'src/test/mocks/pwa-register-react.ts')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __GITHUB_REPO__: JSON.stringify(process.env.VITE_GITHUB_REPO ?? 'hkshu12/wix')
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true
  }
});
