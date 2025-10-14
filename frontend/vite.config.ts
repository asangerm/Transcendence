import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://backend:8000',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  css: {
    devSourcemap: true
  }
});
