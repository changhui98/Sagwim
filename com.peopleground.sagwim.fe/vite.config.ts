import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // sockjs-client는 Node.js 환경 변수 `global`을 참조한다.
  // 브라우저에는 `global`이 없어 import 시점에 ReferenceError가 발생하므로 globalThis 로 매핑한다.
  define: {
    global: 'globalThis',
  },
  server: {
    // 컨테이너 환경에서 외부 접근 허용 (docker-compose dev 실행 시 필요)
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // 로컬 실행 시 localhost:8080, 컨테이너 실행 시 VITE_PROXY_TARGET 환경변수로 오버라이드
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
      '/images': {
        // 정적 이미지 파일을 Spring Boot ResourceHandler(/images/**)로 프록시
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws-chat': {
        // STOMP over SockJS 채팅 엔드포인트
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
