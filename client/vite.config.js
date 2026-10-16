import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-flow': ['@xyflow/react'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['@phosphor-icons/react', 'lucide-react', '@iconify/react'],
          'vendor-tiptap': ['@tiptap/react', '@tiptap/starter-kit']
        }
      }
    }
  }
});
