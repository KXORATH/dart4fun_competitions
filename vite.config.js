import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead', 'ie 11', 'chrome 49'],
      renderModernChunks: false,
    }),
  ],
  base: '/dart4fun_competitions/',
  build: {
    target: 'es2015',
  }
})
