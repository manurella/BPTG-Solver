import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// On GitHub Actions the repo name becomes the base path for Pages
const base = process.env.GITHUB_ACTIONS === 'true' ? '/BPTG-Solver/' : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Don't register SW in dev — avoids request interception white-screen
      devOptions: { enabled: false },
      manifest: {
        name: 'BPTG Schedule Solver',
        short_name: 'BPTG Solver',
        description: 'Optimal puzzle solver for Blackpink the Game — Schedule mode',
        theme_color: '#ff0070',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@data': resolve(__dirname, 'src/data'),
      '@worker': resolve(__dirname, 'src/worker'),
    },
  },
  worker: { format: 'es' },
});
