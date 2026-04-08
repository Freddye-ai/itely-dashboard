import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sharepoint': {
        target: 'https://financebrazil-my.sharepoint.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sharepoint/, ''),
      },
    },
  },
})
