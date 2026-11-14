import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('/node_modules/')) {
            if (normalized.includes('/@tiptap/') || normalized.includes('/prosemirror')) {
              return 'vendor-editor';
            }
            if (normalized.includes('/recharts/') || normalized.includes('/d3-') || normalized.includes('/victory-vendor/')) {
              return 'vendor-charts';
            }
            if (normalized.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            if (normalized.includes('/@tanstack/') || normalized.includes('/axios/')) {
              return 'vendor-query';
            }
            if (normalized.includes('/react/') || normalized.includes('/react-dom/') || normalized.includes('/react-router/')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
});
