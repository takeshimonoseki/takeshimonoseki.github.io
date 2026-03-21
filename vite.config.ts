import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  appType: 'mpa',
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        request: fileURLToPath(new URL('./request/index.html', import.meta.url)),
        driver: fileURLToPath(new URL('./driver/index.html', import.meta.url)),
        simulator: fileURLToPath(new URL('./simulator/index.html', import.meta.url)),
      },
    },
  },
});