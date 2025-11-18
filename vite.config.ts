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
    include: [
      '@cornerstonejs/core',
      '@cornerstonejs/tools',
      'cornerstone-wado-image-loader'
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Ensure web workers are handled correctly
        manualChunks: undefined,
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
