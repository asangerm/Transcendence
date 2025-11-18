import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "ssl/key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "ssl/cert.pem")),
    },
    proxy: {
      "/api": {
        target: "https://localhost:8000", // localhost au lieu de backend
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: "wss://localhost:8000", // localhost au lieu de backend
        ws: true,
        changeOrigin: true,
      }
    }
  },
  css: {
    devSourcemap: true
  }
});
