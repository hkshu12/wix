import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { joinBasePath, pwaScopeFromBase } from './src/lib/basePath';
import { PWA_DISPLAY_ORIENTATION } from './src/lib/studioLayoutMedia';

const base = process.env.VITE_BASE_PATH ?? '/';
const pwaScope = pwaScopeFromBase(base);
const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
const githubRepo = process.env.VITE_GITHUB_REPO ?? 'hkshu12/wix';

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __GITHUB_REPO__: JSON.stringify(githubRepo)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'icon-mark-96.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'wix',
        short_name: 'wix',
        description: '多轨环境声与自定义音乐混音',
        theme_color: '#1a4fd6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: PWA_DISPLAY_ORIENTATION,
        start_url: pwaScope.start_url,
        scope: pwaScope.scope,
        icons: [
          {
            src: joinBasePath(base, 'icon-192.png'),
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: joinBasePath(base, 'icon-512.png'),
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: joinBasePath(base, 'icon-512.png'),
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,ogg}']
      }
    })
  ],
  server: {
    host: '0.0.0.0'
  }
});
