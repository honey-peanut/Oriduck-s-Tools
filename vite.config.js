import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 하위 경로(/<repo>/)에서도 에셋이 로드되도록 상대 경로 사용
  base: './',
  plugins: [react()],
})
