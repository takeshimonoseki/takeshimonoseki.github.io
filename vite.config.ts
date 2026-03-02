import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/TAKE/', // ← リポジトリ名が TAKE の場合はこれ
})