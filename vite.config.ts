import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('three.core')) {
              return 'vendor-three-core';
            }
            if (id.includes('node_modules/three')) {
              return 'vendor-three-extras';
            }
            if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) {
              return 'vendor-motion';
            }
            if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
              return 'vendor-react';
            }
          },
        },
      },
    },
  };
});
