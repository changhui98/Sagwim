import { createPortal } from 'react-dom'
import { useModalKeyboard } from '../../hooks/useModalKeyboard'
import styles from './AlertDialog.module.css'

type AlertVariant = 'success' | 'error'

interface AlertDialogProps {
  isOpen: boolean
  variant: AlertVariant
  message: string
  onClose: () => void
  confirmLabel?: string
}

export function AlertDialog({
  isOpen,
  variant,
  message,
  onClose,
  confirmLabel = '확인',
}: AlertDialogProps) {
  useModalKeyboard(isOpen, onClose, ['Escape', 'Enter'])

  if (!isOpen) return null

  const emoji = variant === 'success' ? '✅' : '❌'

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-message"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <span className={styles.emoji} aria-hidden="true">{emoji}</span>
        <p id="alert-dialog-message" className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
