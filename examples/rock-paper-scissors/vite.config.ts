import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
     allowedHosts: ["9fbf06f13023.ngrok-free.app"],
  }
 
})
