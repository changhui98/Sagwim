/**
 * AuthContext — FE AuthContext.tsx 패턴 이식
 *
 * 차이점:
 * - 토큰 저장: localStorage → expo-secure-store (secureStore 모듈 사용)
 * - 앱 부팅 시 SecureStore 비동기 읽기 → isBootstrapping 상태로 로딩 처리
 * - apiClient 인터셉터가 401 시 토큰 삭제 → AuthContext에서 isAuthenticated 재계산
 * - signOut API 호출은 AuthContext 내부에서 처리 (FE 패턴 동일)
 */

import React, {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { signOut as signOutApi } from '../api/authApi'
import { getMe } from '../api/userApi'
import type { UserDetailResponse } from '../types/user'
import { setToken as saveToken, getToken, deleteToken } from '../lib/secureStore'

interface AuthContextValue {
  /** 현재 저장된 Bearer 토큰 (없으면 빈 문자열) */
  token: string
  /** SecureStore 초기 읽기가 완료됐는지 */
  isBootstrapping: boolean
  isAuthenticated: boolean
  login: (token: string) => Promise<void>
  logout: () => Promise<void>
  meUsername: string | null
  meNickname: string | null
  meRole: string | null
  meProfileImageUrl: string | null
  setMeProfile: (profile: UserDetailResponse | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string>('')
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const [meUsername, setMeUsername] = useState<string | null>(null)
  const [meNickname, setMeNickname] = useState<string | null>(null)
  const [meRole, setMeRole] = useState<string | null>(null)
  const [meProfileImageUrl, setMeProfileImageUrl] = useState<string | null>(null)

  const setMeProfile = useCallback((profile: UserDetailResponse | null) => {
    if (!profile) {
      setMeUsername(null)
      setMeNickname(null)
      setMeRole(null)
      setMeProfileImageUrl(null)
      return
    }
    setMeUsername(profile.username)
    setMeNickname(profile.nickname)
    setMeRole(profile.role)
    setMeProfileImageUrl(
      profile.profileImageUrl?.trim() ? profile.profileImageUrl.trim() : null,
    )
  }, [])

  // 앱 부팅: SecureStore에서 토큰 복원
  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const stored = await getToken()
        if (cancelled) return
        if (stored) {
          setToken(stored)
        }
      } catch (e) {
        console.warn('[AuthContext] 토큰 복원 실패:', e)
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  // 토큰 변경 시 /users/me 로 프로필 로딩 (FE 패턴 동일)
  useEffect(() => {
    if (isBootstrapping) return
    if (!token.trim()) {
      setMeProfile(null)
      return
    }

    let cancelled = false
    getMe()
      .then((profile) => {
        if (cancelled) return
        setMeProfile(profile)
      })
      .catch(() => {
        if (cancelled) return
        setMeProfile(null)
      })

    return () => {
      cancelled = true
    }
  }, [token, isBootstrapping, setMeProfile])

  const login = useCallback(async (nextToken: string) => {
    await saveToken(nextToken)
    setToken(nextToken)
  }, [])

  const logout = useCallback(async () => {
    const currentToken = token
    // 토큰 먼저 삭제 (서버 실패해도 클라이언트는 로그아웃)
    await deleteToken()
    setToken('')
    setMeProfile(null)

    if (currentToken.trim()) {
      signOutApi().catch(() => {
        // 서버 로그아웃 실패 무시 — 클라이언트 토큰은 이미 삭제됨
      })
    }
  }, [token, setMeProfile])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isBootstrapping,
      isAuthenticated: token.length > 0,
      login,
      logout,
      meUsername,
      meNickname,
      meRole,
      meProfileImageUrl,
      setMeProfile,
    }),
    [
      token,
      isBootstrapping,
      login,
      logout,
      meUsername,
      meNickname,
      meRole,
      meProfileImageUrl,
      setMeProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
