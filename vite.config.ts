import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: リポジトリ名に合わせる（tcta-tottori/onshitsu）
export default defineConfig({
  plugins: [react()],
  base: '/onshitsu/',
})
