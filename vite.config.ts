import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base relativa: permite publicar en cualquier hosting estatico (GitHub Pages,
// Netlify, Vercel) sin reescribir rutas. El enrutado es por hash, asi que
// recargar una URL profunda nunca da 404.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
