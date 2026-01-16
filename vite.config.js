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
          if (id.includes('node_modules')) {
            // Isola solo le librerie giganti e indipendenti
            if (id.includes('jspdf') || id.includes('qrcode') || id.includes('jsbarcode')) return 'pdf-utils';
            if (id.includes('html5-qrcode')) return 'scanner';
            // Tutto il resto (React, Lucide, Recharts) va nel main chunk di default
          }
        }
      }
    }
  }
})
