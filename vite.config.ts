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
        manualChunks: {
          // Core React libraries
          vendor: ["react", "react-dom"],

          // UI components (grouped by usage patterns)
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-popover",
            "@radix-ui/react-toast",
            "@radix-ui/react-alert-dialog"
          ],

          // Form and input components
          forms: [
            "@hookform/resolvers",
            "react-hook-form",
            "zod"
          ],

          // Chart and visualization libraries
          charts: [
            "recharts",
            "html2canvas",
            "jspdf",
            "jspdf-autotable"
          ],

          // Date and utility libraries
          utils: [
            "date-fns",
            "clsx",
            "tailwind-merge"
          ],

          // Icon libraries
          icons: [
            "lucide-react"
          ]
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
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      },

      // External dependencies to exclude from bundle
      external: [],
    },

    // ESBuild configuration for better minification
    esbuildOptions: {
      drop: ["console", "debugger"], // Remove console and debugger statements
      minify: true,
      treeShaking: true
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB

    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB

  
    // Enable experimental features
    experimentalRenderBuiltUrl: (filename: string) => {
      // Add cache busting query parameter for dynamic imports
      return { js: `/${filename}?v=${Date.now()}` };
    }
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
      "@radix-ui/react-dialog",
      "@radix-ui/react-select"
    ],
    exclude: [
      // Exclude large dependencies from pre-bundling
      "jspdf",
      "html2canvas",
      "recharts"
    ]
  }
});