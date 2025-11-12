import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      // Force scheduler to use the correct module
      "scheduler": "scheduler/index.js",
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [/.replit\.dev$/],
    hmr: {
      protocol: "wss",
      clientPort: 443
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist/public",
    sourcemap: false,
    cssMinify: true,
    cssCodeSplit: true,
    minify: "esbuild",
    target: "es2015",
    rollupOptions: {
      output: {
        // Simplified chunking - put React and scheduler together
        manualChunks: (id) => {
          // CRITICAL: Keep React, React-DOM, and Scheduler together
          // This prevents the lazy initialization race condition
          if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
            return 'vendor';
          }

          // UI components
          if (id.includes('@radix-ui')) {
            return 'ui';
          }

          // Form components
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
            return 'forms';
          }

          // Charts
          if (id.includes('recharts') || id.includes('html2canvas')) {
            return 'charts-core';
          }

          if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'pdf-export';
          }

          // Utilities
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'utils';
          }

          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }

          // Security
          if (id.includes('dompurify') || id.includes('xss')) {
            return 'security';
          }

          // Page-specific chunks
          if (id.includes('custodial-inspection')) {
            return 'inspection-pages';
          }

          if (id.includes('whole-building')) {
            return 'building-inspection';
          }

          if (id.includes('custodial-notes')) {
            return 'notes-pages';
          }

          if (id.includes('monthly-feedback')) {
            return 'feedback-pages';
          }

          if (id.includes('inspection-data')) {
            return 'data-pages';
          }

          if (id.includes('admin-inspections')) {
            return 'admin-pages';
          }

          if (id.includes('scores-dashboard')) {
            return 'dashboard-pages';
          }

          if (id.includes('node-fetch')) {
            return 'networking';
          }

          return 'misc';
        },

        entryFileNames: `assets/[name]-[hash]-v7.js`,
        chunkFileNames: `assets/[name]-[hash]-v7.js`,
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash]-v7.[ext]`;
          }
          if (/woff|woff2|ttf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash]-v7.[ext]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash]-v7.[ext]`;
          }

          return `assets/[name]-[hash]-v7.[ext]`;
        },

        experimentalMinChunkSize: 20000,
      },

      external: [],
    },

    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
  },

  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },

  css: {
    devSourcemap: false,
  },

  // CRITICAL: Optimize dependencies to prevent scheduler issues
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "scheduler", // IMPORTANT: Include scheduler explicitly
      "@radix-ui/react-dialog",
      "@radix-ui/react-select"
    ],
    exclude: [
      "jspdf",
      "html2canvas",
      "recharts",
    ],
    esbuildOptions: {
      target: 'es2020',
      // Ensure scheduler is bundled correctly
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    },
    // Force eager optimization
    force: false,
  }
});
