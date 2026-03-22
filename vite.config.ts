import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/MEDTRACK/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/MEDTRACK/',
      manifest: {
        name: 'Medication Tracker',
        short_name: 'MedTrack',
        start_url: '/MEDTRACK/',
        scope: '/MEDTRACK/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})