import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/OrderEntryTool/',
  server: {
    port: 3000,
    proxy: {
      '/fmi': {
        target: 'https://modd.mainspringhost.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js'
  }
});
