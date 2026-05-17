import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const apiPort = process.env.OSS_PREFLIGHT_API_PORT || '3001';
const webPort = Number(process.env.OSS_PREFLIGHT_WEB_PORT || 3000);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: webPort,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});

// Made with Bob
