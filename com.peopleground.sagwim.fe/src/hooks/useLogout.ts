import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return useCallback(() => {
    logout()
    navigate('/', { replace: true })
  }, [logout, navigate])
}
