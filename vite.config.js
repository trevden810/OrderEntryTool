import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/fmi': {
        target: 'https://modd.mainspringhost.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
});
