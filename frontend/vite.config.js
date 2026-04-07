import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

const certPath = path.resolve(__dirname, '../backend/localhost+3.pem')
const keyPath = path.resolve(__dirname, '../backend/localhost+3-key.pem')
const hasLocalCerts = fs.existsSync(certPath) && fs.existsSync(keyPath)

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Inventario - Sistema de Gestión',
        short_name: 'Inventario',
        description: 'Sistema de inventario con captura de fotos y clasificación',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    https: hasLocalCerts
      ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
      : false,
    proxy: hasLocalCerts
      ? {
          '/api': {
            target: 'https://localhost:3443',
            changeOrigin: true,
            secure: false
          }
        }
      : {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true
          }
        }
  }
})
