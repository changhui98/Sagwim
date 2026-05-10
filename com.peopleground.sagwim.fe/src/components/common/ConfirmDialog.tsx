import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalKeyboard } from '../../hooks/useModalKeyboard'
import styles from './ConfirmDialog.module.css'

type ConfirmVariant = 'primary' | 'danger'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: ConfirmVariant
  isLoading?: boolean
  confirmDisabled?: boolean
  children?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

const VARIANT_CLASS_MAP: Record<ConfirmVariant, string> = {
  primary: 'btn btn-primary',
  danger: 'btn btn-danger',
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  confirmVariant = 'primary',
  isLoading = false,
  confirmDisabled = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useModalKeyboard(isOpen, onCancel)

  if (!isOpen) return null

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-dialog-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.message}>{message}</p>
        {children}
        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={VARIANT_CLASS_MAP[confirmVariant]}
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
            autoFocus
          >
            {isLoading ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
