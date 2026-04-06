import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/chats':  'http://localhost:3000',
      '/ask':    'http://localhost:3000',
      '/upload': 'http://localhost:3000',
    },
  },
});
