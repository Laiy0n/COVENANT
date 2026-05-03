import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') }
    },
    server: {
      port: 3000,
      open: false,
      host: true
    },
    // Expose REACT_APP_ vars to code that uses process.env
    define: {
      'process.env.REACT_APP_BACKEND_URL': JSON.stringify(
        env.REACT_APP_BACKEND_URL || 'http://localhost:8001'
      )
    }
  }
})
