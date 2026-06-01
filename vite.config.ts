import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base:
    process.env.BASE_PATH && process.env.BASE_PATH !== '/'
      ? `${process.env.BASE_PATH.replace(/\/+$/, '')}/`
      : '/',
  plugins: [react()],
})
