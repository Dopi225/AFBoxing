import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import viteImagemin from 'vite-plugin-imagemin'

const apiProxyTarget = (process.env.VITE_API_PROXY_TARGET || '').trim().replace(/\/$/, '')

// https://vite.dev/config/
export default defineConfig({
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          icons: [
            '@fortawesome/fontawesome-svg-core',
            '@fortawesome/react-fontawesome',
            '@fortawesome/free-solid-svg-icons',
            '@fortawesome/free-brands-svg-icons'
          ]
        }
      }
    }
  },
  server: apiProxyTarget
    ? {
        proxy: {
          '/api': { target: apiProxyTarget, changeOrigin: true },
          '/uploads': { target: apiProxyTarget, changeOrigin: true }
        }
      }
    : undefined,
  plugins: [
    react(),
    // Évite imagemin pendant les tests Vitest (trop lent / inutile)
    ...(process.env.VITEST
      ? []
      : [
          viteImagemin({
            gifsicle: { optimizationLevel: 3 },
            optipng: { optimizationLevel: 7 },
            mozjpeg: { quality: 75 },
            pngquant: { quality: [0.7, 0.85], speed: 5 },
            svgo: true,
            webp: { quality: 75 }
          })
        ])
  ],
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    css: true
  }
})
