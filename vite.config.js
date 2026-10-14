// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      /* Use our own sw.js so we can control Background Sync */
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',

      /* Enable SW in dev so you can test offline without building */
      devOptions: {
        enabled: true,
        type: 'module',
      },

      /* Web-app manifest — makes the site installable */
      manifest: {
        name: 'KAP – Karachi Auto Parts',
        short_name: 'KAP',
        description: 'Inventory, sales and customer management',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.png', sizes: 'any',     type: 'image/png' },
          { src: 'icon192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },

      /* Cache every static asset Vite emits */
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://kap-new-backend.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
