import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La aplicación se publica detrás del proxy nginx en la ruta /app/
export default defineConfig({
  base: '/app/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5176,
    proxy: {
      '/api': { target: 'http://localhost:8084', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:8084', ws: true, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
