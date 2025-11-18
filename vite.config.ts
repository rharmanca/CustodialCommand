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
    target: "es2020", // Target ES2020 for optional chaining support
    rollupOptions: {
      output: {
        // Conservative code splitting - let Vite handle chunking automatically
        // This prevents deployment issues while maintaining lazy loading benefits
        manualChunks: undefined,

        // Keep file naming for cache busting
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
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
      // Exclude large dependencies from pre-bundling for better chunking
      "jspdf",
      "html2canvas",
      "recharts",
      "xlsx",
      "date-fns",
      "framer-motion",
      "lucide-react",
      // Exclude scheduler to prevent bundling issues
      "scheduler"
    ],
    // Force optimization of scheduler
    esbuildOptions: {
      target: 'es2020'
    }
  }
});