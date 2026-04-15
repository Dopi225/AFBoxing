import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import viteImagemin from 'vite-plugin-imagemin'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion': ['framer-motion']
        }
      }
    }
  }, 
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
            pngquant: { quality: [0.7, 0.85], speed: 3 },
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
