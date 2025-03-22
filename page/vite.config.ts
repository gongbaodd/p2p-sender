import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/peer': 'http://localhost:3000',
      '/createRoom': 'http://localhost:3000',
      '/addRoom': 'http://localhost:3000',
      '/leaveRoom': 'http://localhost:3000'
    }
  }
});