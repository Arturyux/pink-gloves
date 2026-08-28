import { defineConfig } from 'vite'

export default defineConfig({
  // relative paths, so dist/ works in any folder on one.com
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    open: true,
  },
})
