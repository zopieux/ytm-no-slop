import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../'),
    },
  },
  publicDir: '../../public',
  root: __dirname,
  build: {
    outDir: '../../.output/screenshot-build',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
