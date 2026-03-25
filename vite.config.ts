import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // 1. Add this import

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'path': 'path-browserify',
      // 2. Force a single version of React (Fixes the White Screen/Hook error)
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    // 3. Include OpenSign here
    include: ['@uipath/uipath-typescript', '@opensign/react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/accelirateuipcl': {
        target: 'https://cloud.uipath.com',
        changeOrigin: true,
        secure: true,
      },
    },
  }
})