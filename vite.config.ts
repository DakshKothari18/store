import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // This ensures assets load correctly on GitHub Pages
  define: {
    'process.env': {}
  }
});