import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        // Exact-match alias: adds a compatibility export for FaSleepyhead.
        find: /^react-icons\/fa$/,
        replacement: fileURLToPath(new URL('./src/utils/react-icons-fa-compat.js', import.meta.url))
      }
    ]
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icons.svg'],
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html'
      },
      manifest: {
        id: '/',
        name: 'MaaSathi',
        short_name: 'MaaSathi',
        description: 'Real-time health monitoring for rural maternal and family care.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'en',
        theme_color: '#C2185B',
        background_color: '#FFFFFF',
        categories: ['medical', 'health', 'productivity'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
})
