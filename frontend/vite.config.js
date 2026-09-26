import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Same-origin /api calls in dev: no CORS setup needed on the backend.
  server: {
    proxy: { '/api': 'http://localhost:8000' },
    // WSL can't watch files on a Windows drive (/mnt/*); poll there instead.
    watch: { usePolling: Boolean(process.env.WSL_DISTRO_NAME) },
  },
})
