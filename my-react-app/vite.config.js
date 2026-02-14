import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    // This polyfills 'process.env' for the browser
    'process.env': {} 
  }

})
