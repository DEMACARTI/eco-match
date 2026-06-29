import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'window', // Fixes the "global is not defined" issue
  },
  resolve: {
    alias: {
      'sockjs-client': 'sockjs-client/dist/sockjs.js', // Ensures compatibility
    },
  },
});