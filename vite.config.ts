import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** GitHub Pages serves this for unknown paths (client routes). Existing files such as sw.js still take precedence. */
function githubPagesSpaFallback(): Plugin {
  return {
    name: 'github-pages-spa-fallback',
    closeBundle: {
      sequential: true,
      order: 'post',
      handler() {
        const indexPath = path.resolve('dist/index.html')
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, path.resolve('dist/404.html'))
        }
        const webManifestPath = path.resolve('dist/manifest.webmanifest')
        if (fs.existsSync(webManifestPath)) {
          fs.copyFileSync(webManifestPath, path.resolve('dist/manifest.json'))
        }
      },
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      strategies: 'generateSW',
      filename: 'sw.js',
      manifestFilename: 'manifest.webmanifest',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      includeManifestIcons: true,
      manifest: {
        id: '/',
        name: 'My Meds Record',
        short_name: 'My Meds',
        description:
          'A calm, simple way to organise daily medication and keep a useful record.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#2563eb',
        background_color: '#eef4ff',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json,txt,xml}'],
        navigateFallback: 'index.html',
        // Do not treat static PWA files as SPA navigations (otherwise /sw.js looks like the app HTML).
        navigateFallbackDenylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/],
      },
    }),
    githubPagesSpaFallback(),
  ],
})
