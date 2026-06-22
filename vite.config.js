import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 하위 경로(/<repo>/)에서 에셋이 로드되도록 base 지정(앞뒤 슬래시 필수)
  base: '/Oriduck-s-Tools/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // 5173이 사용중이면 다른 포트로 밀리지 않고 에러로 알림
  },
})
