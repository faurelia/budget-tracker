import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Charts pull in a large dependency; keeping it in its own chunk keeps
        // the app chunk small and lets the browser cache it separately.
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || /node_modules\/d3-/.test(id)) {
              return 'charts'
            }
            if (/node_modules\/react(-dom)?\//.test(id)) return 'react'
          }
          return undefined
        },
      },
    },
  },
})
