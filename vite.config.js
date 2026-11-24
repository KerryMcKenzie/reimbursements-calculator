import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // The protected calculator (src/App.jsx) is written to /app/ so the Netlify
        // Edge Function can refuse it to anyone who hasn't signed in.
        // Everything else (login page, shared code) stays public in /assets/.
        chunkFileNames: (chunk) =>
          chunk.facadeModuleId?.replace(/\\/g, '/').endsWith('/src/App.jsx')
            ? 'app/[name]-[hash].js'
            : 'assets/[name]-[hash].js',
      },
    },
  },
})
