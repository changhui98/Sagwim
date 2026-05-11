import axios from 'axios'
import { deleteToken, getToken } from './secureStore'

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

if (!BASE_URL) {
  console.warn('[apiClient] EXPO_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.')
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request 인터셉터 — SecureStore에서 토큰을 읽어 Authorization 헤더 자동 부착
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken()
    if (token) {
      config.headers.Authorization = token
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response 인터셉터 — 401 시 토큰 삭제 (리프레시는 별도 구현 예정)
// 화면 전환(로그인으로 리다이렉트)은 AuthContext에서 토큰 소실을 감지해 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await deleteToken()
      console.warn('[apiClient] 401 — 토큰 삭제 완료')
    }
    return Promise.reject(error)
  },
)

export default apiClient
