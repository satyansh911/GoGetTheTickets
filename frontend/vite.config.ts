import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development the Spring Boot API runs on :8080; Vite forwards /api to it.
// In production the built files are served by Spring Boot itself (see the Dockerfile).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
