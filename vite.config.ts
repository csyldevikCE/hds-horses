import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Copy WASM files for Cornerstone.js codecs
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@cornerstonejs/codec-*/dist/*.wasm',
          dest: 'codecs'
        },
        {
          src: 'node_modules/cornerstone-wado-image-loader/dist/dynamic-import/*.wasm',
          dest: 'codecs'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: [
      '@cornerstonejs/core',
      '@cornerstonejs/tools',
      'cornerstone-wado-image-loader'
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Manual chunking for better code splitting and caching
        manualChunks: (id) => {
          // Separate large vendor libraries into their own chunks
          if (id.includes('node_modules')) {
            // Cornerstone medical imaging libraries (heavy)
            if (id.includes('@cornerstonejs') || id.includes('cornerstone-wado-image-loader') || id.includes('dicom-parser')) {
              return 'cornerstone';
            }
            // React and core UI libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            // Charts and visualization
            if (id.includes('recharts') || id.includes('react-simple-maps')) {
              return 'charts';
            }
            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'tanstack-query';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // All other node_modules
            return 'vendor';
          }
        },
      }
    },
    // Increase chunk size warning limit for medical imaging libraries
    chunkSizeWarningLimit: 2000,
  },
  worker: {
    format: 'es' as const,
    plugins: () => []
  }
}));
