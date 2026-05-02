import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  server:{
    https: {
      cert: fs.readFileSync('./localhost+1.pem'),
      key:  fs.readFileSync('./localhost+1-key.pem'),
    },
    host:true,
    port:5173,
    proxy:{
      '/api':{
        target:'http://localhost:8080',
        changeOrigin:true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
