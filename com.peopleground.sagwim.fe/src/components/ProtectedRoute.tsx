import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthGate } from '../context/AuthGateContext'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const { open } = useAuthGate()

  useEffect(() => {
    if (!isAuthenticated) open()
  }, [isAuthenticated, open])

  if (!isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
