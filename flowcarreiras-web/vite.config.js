import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Flow Carreiras',
        short_name: 'FlowCarreiras',
        description: 'Plataforma para artistas emergentes de Recife',
        theme_color: '#1a1a2e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // Não devolver o index.html do SPA para estas rotas: elas são servidas
        // pelo backend/Streamlit (senão o service worker "sequestra" o /dashboard
        // dentro do iframe e mostra o app React em vez do dashboard).
        navigateFallbackDenylist: [/^\/dashboard/, /^\/api/, /^\/uploads/],
        // Network-first para obras (dados frescos quando online)
        runtimeCaching: [
          {
            // Padrão relativo funciona em dev (via proxy Vite) e prod (via proxy Nginx)
            urlPattern: /\/api\/obras/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'obras-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 }
            }
          },
          {
            urlPattern: /\/uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 604800 }
            }
          },
          {
            urlPattern: /\/api\/tags/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'tags-cache' }
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Necessário para acessar o Vite dev server de fora do container
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/uploads': 'http://localhost:8080'
    }
  }
})
