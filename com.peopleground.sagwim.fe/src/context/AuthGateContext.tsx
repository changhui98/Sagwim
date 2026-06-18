import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { AuthRequiredModal } from '../components/common/AuthRequiredModal'

interface AuthGateContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

const AuthGateContext = createContext<AuthGateContextValue | undefined>(undefined)

/**
 * 비로그인 사용자가 회원 전용 페이지에 진입할 때 띄우는 안내 모달의 전역 상태.
 * ProtectedRoute가 미인증을 감지하면 open()을 호출한다.
 */
export function AuthGateProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <AuthGateContext.Provider value={{ isOpen, open, close }}>
      {children}
      <AuthRequiredModal isOpen={isOpen} onClose={close} />
    </AuthGateContext.Provider>
  )
}

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext)
  if (!ctx) {
    throw new Error('useAuthGate must be used within AuthGateProvider')
  }
  return ctx
}
