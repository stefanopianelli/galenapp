import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  			tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react')) {
            return 'react';
          }
          if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'jspdf';
          }
        }
      }
    }
  }
})
