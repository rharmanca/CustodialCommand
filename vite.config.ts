import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: 'Custodial Command',
        short_name: 'Custodial',
        description: 'Professional custodial inspection and reporting system for educational facilities',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        categories: ['productivity', 'business', 'education'],
        lang: 'en-US',
        dir: 'ltr',
        scope: '/'
      },
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      devOptions: { enabled: false },
      registerType: 'autoUpdate',
      workbox: { 
        globPatterns: ['**/*.{js,css,html}', '**/*.{svg,png,jpg,gif}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },
    }),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Sentry plugin for source maps (production only)
    ...(process.env.NODE_ENV === 'production' && process.env.SENTRY_AUTH_TOKEN ? [
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      })
    ] : []),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // MUI ecosystem
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui';
            }
            // Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // State management
            if (id.includes('jotai')) {
              return 'vendor-state';
            }
            // Monitoring
            if (id.includes('@sentry') || id.includes('web-vitals')) {
              return 'vendor-monitoring';
            }
            // Other vendor libraries
            return 'vendor-misc';
          }
          
          // App chunks
          if (id.includes('/pages/')) {
            return 'pages';
          }
          if (id.includes('/monitoring/')) {
            return 'monitoring';
          }
          if (id.includes('/mobile/')) {
            return 'mobile';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // Warn for chunks > 500KB
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      'react-router',
      'jotai',
    ],
  },
});
