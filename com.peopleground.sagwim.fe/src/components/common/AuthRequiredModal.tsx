import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useModalKeyboard } from '../../hooks/useModalKeyboard'
import styles from './AuthRequiredModal.module.css'

interface AuthRequiredModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 비로그인 사용자가 회원 전용 페이지(모임·게시글 등)에 진입할 때
 * /login 으로 곧장 튕기는 대신 보여주는 안내 모달.
 * 가입을 유도하면서 로그인·회원가입으로 이동할 수 있게 한다.
 */
export function AuthRequiredModal({ isOpen, onClose }: AuthRequiredModalProps) {
  const navigate = useNavigate()
  useModalKeyboard(isOpen, onClose)

  if (!isOpen) return null

  const goLogin = () => {
    onClose()
    navigate('/login')
  }

  const goSignUp = () => {
    onClose()
    navigate('/sign-up')
  }

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-required-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 id="auth-required-title" className={styles.title}>
          회원만 이용할 수 있어요
        </h2>
        <p className={styles.message}>
          지금 가입하고 마음 맞는 사람들과 모임에 참여해보세요.
        </p>
        <div className={styles.actions}>
          <button type="button" className="btn btn-secondary btn-full" onClick={goSignUp}>
            회원가입
          </button>
          <button type="button" className="btn btn-primary btn-full" onClick={goLogin} autoFocus>
            로그인
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
