import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthGate } from '../context/AuthGateContext'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const { open } = useAuthGate()
  // 로그아웃(머무는 중 인증 해제)과 게스트 직접 진입을 구분 —
  // 로그아웃 시에는 안내 모달 없이 공개 메인으로만 보낸다.
  // 미인증 마운트는 즉시 리다이렉트로 언마운트되므로 마운트 시점 값이면 충분하다.
  const [wasAuthenticatedOnMount] = useState(isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated && !wasAuthenticatedOnMount) open()
  }, [isAuthenticated, wasAuthenticatedOnMount, open])

  if (!isAuthenticated) {
    return <Navigate to={wasAuthenticatedOnMount ? '/' : '/app'} replace />
  }

  return <Outlet />
}
