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
    sourcemap: false, // Disable sourcemaps in production for better performance
    cssMinify: true,
    cssCodeSplit: true,
    minify: "esbuild", // Use esbuild instead of terser (faster)
    target: "es2015", // Target modern browsers for better optimization
    rollupOptions: {
      output: {
        // Optimized manual chunks for better caching
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor';
          }

          // UI components (grouped by usage patterns)
          if (id.includes('@radix-ui')) {
            return 'ui';
          }

          // Form and input components
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
            return 'forms';
          }

          // Chart and visualization libraries - SPLIT FURTHER
          if (id.includes('recharts') || id.includes('html2canvas')) {
            return 'charts-core';
          }

          if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'pdf-export';
          }

          // Date and utility libraries
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'utils';
          }

          // Icon libraries
          if (id.includes('lucide-react')) {
            return 'icons';
          }

          // Heavy utilities
          if (id.includes('dompurify') || id.includes('xss')) {
            return 'security';
          }

          // Page-specific chunks (based on route)
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

          // Large third-party libraries
          if (id.includes('node-fetch')) {
            return 'networking';
          }

          // Default chunk for everything else
          return 'misc';
        },

        // Optimized file naming with better cache busting
        entryFileNames: `assets/[name]-[hash]-v6.js`,
        chunkFileNames: `assets/[name]-[hash]-v6.js`,
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];

          // Separate different asset types for better caching
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash]-v6.[ext]`;
          }
          if (/woff|woff2|ttf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash]-v6.[ext]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash]-v6.[ext]`;
          }

          return `assets/[name]-[hash]-v6.[ext]`;
        },

        // Experimental features for better optimization
        experimentalMinChunkSize: 20000, // 20KB minimum chunk size
      },

      // Additional Rollup optimizations
      // Disabled aggressive treeshaking to fix React scheduler bundling
      // treeshake: {
      //   moduleSideEffects: false,
      //   propertyReadSideEffects: false,
      //   unknownGlobalSideEffects: false
      // },

      // External dependencies to exclude from bundle
      external: [],
    },

    // ESBuild configuration - keep it simple to avoid module issues
    // esbuildOptions: {
    //   minify: true,
    //   treeShaking: true
    // },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB

    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB

  
    // Disable experimental features that might cause issues
    // experimentalRenderBuiltUrl: (filename: string) => {
    //   return { js: `/${filename}?v=${Date.now()}` };
    // }
  },

  // Define global constants for build optimization
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },

  // CSS optimizations
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      // Enable PostCSS optimizations
    }
  },

  // Optimizations for dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select"
    ],
    exclude: [
      // Exclude large dependencies from pre-bundling
      "jspdf",
      "html2canvas",
      "recharts",
      // Exclude scheduler to prevent bundling issues
      "scheduler"
    ],
    // Force optimization of scheduler
    esbuildOptions: {
      target: 'es2020'
    }
  }
});