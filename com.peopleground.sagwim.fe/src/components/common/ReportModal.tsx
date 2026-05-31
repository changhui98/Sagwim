import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createReport, type ReportTargetType } from '../../api/reportApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { useModalKeyboard } from '../../hooks/useModalKeyboard'
import styles from './ReportModal.module.css'

const MAX_REASON_LENGTH = 500

interface ReportModalProps {
  open: boolean
  onClose: () => void
  targetType: ReportTargetType
  targetId: number
  /** 신고 대상을 사람이 읽기 쉬운 형태로 표시하는 선택적 레이블 */
  targetLabel?: string
  /** 모달을 열 때 이미 신고된 항목임이 확정된 경우, 사유 폼 대신 안내 화면을 띄운다 */
  presetAlreadyReported?: boolean
  /** 신고 성공 시 호출 (호출자가 로컬 state의 reportedByMe 를 갱신할 수 있도록) */
  onSuccess?: () => void
}

const TARGET_TYPE_LABEL: Record<ReportTargetType, string> = {
  POST: '게시글',
  COMMENT: '댓글',
}

/**
 * 글로벌 신고 모달.
 * 게시글 카드, 게시글 상세, 댓글 등 여러 위치에서 재사용 가능하다.
 */
export function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel,
  presetAlreadyReported = false,
  onSuccess,
}: ReportModalProps) {
  const { token } = useAuth()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyReported, setAlreadyReported] = useState(false)

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (open) {
      setReason('')
      setErrorMsg(null)
      setSubmitted(false)
      setAlreadyReported(presetAlreadyReported)
    }
  }, [open, presetAlreadyReported])

  // ESC 키로 닫기
  useModalKeyboard(open, onClose)

  if (!open) return null

  const typeLabel = TARGET_TYPE_LABEL[targetType] ?? targetType
  const titleText = targetLabel
    ? `"${targetLabel}" 신고`
    : `${typeLabel}을 신고합니다`

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setErrorMsg('신고 사유를 입력해주세요.')
      return
    }
    if (reason.length > MAX_REASON_LENGTH) {
      setErrorMsg(`신고 사유는 ${MAX_REASON_LENGTH}자 이하로 입력해주세요.`)
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      await createReport(token, { targetType, targetId, reason: reason.trim() })
      onSuccess?.()
      setSubmitted(true)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setAlreadyReported(true)
        } else if (err.status === 400) {
          setErrorMsg(err.message || '신고할 수 없는 콘텐츠입니다.')
        } else {
          setErrorMsg(err.message || '신고 처리 중 오류가 발생했습니다.')
        }
      } else {
        setErrorMsg('신고 처리 중 오류가 발생했습니다.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isOverLimit = reason.length > MAX_REASON_LENGTH

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className={styles.statusView}>
            <div className={`${styles.statusIcon} ${styles.statusIconSuccess}`}>
              <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
                <path
                  d="M5 12l5 5L20 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 id="report-modal-title" className={styles.statusTitle}>
              신고가 접수되었습니다
            </h2>
            <p className={styles.statusMessage}>
              소중한 제보 감사합니다.
              <br />
              검토 후 신속히 조치하겠습니다.
            </p>
            <div className={styles.statusActions}>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                확인
              </button>
            </div>
          </div>
        ) : alreadyReported ? (
          <div className={styles.statusView}>
            <div className={`${styles.statusIcon} ${styles.statusIconInfo}`}>
              <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                <path
                  d="M4 12l5 5L20 6M4 19h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 id="report-modal-title" className={styles.statusTitle}>
              이미 신고한 {typeLabel}입니다
            </h2>
            <p className={styles.statusMessage}>
              같은 {typeLabel}에 대해 한 번만 신고할 수 있어요.
              <br />
              접수된 신고는 관리자가 검토 중입니다.
            </p>
            <div className={styles.statusActions}>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                확인
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 id="report-modal-title" className={styles.title}>
              {titleText}
            </h2>
            <p className={styles.subtitle}>
              {typeLabel}에 대한 신고 사유를 작성해주세요.
              <br />
              허위 신고 시 이용이 제한될 수 있습니다.
            </p>

            <label htmlFor="report-reason" className={styles.fieldLabel}>
              신고 사유 <span aria-hidden="true">*</span>
            </label>
            <div className={styles.textareaWrap}>
              <textarea
                id="report-reason"
                className={styles.textarea}
                placeholder="신고 사유를 자세히 작성해주세요."
                value={reason}
                maxLength={MAX_REASON_LENGTH + 10}
                onChange={(e) => {
                  setReason(e.target.value)
                  if (errorMsg) setErrorMsg(null)
                }}
                autoFocus
              />
            </div>
            <span
              className={`${styles.charCount} ${isOverLimit ? styles.charCountWarn : ''}`}
            >
              {reason.length} / {MAX_REASON_LENGTH}
            </span>

            {errorMsg && <p className={styles.errorMsg} role="alert">{errorMsg}</p>}

            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void handleSubmit()}
                disabled={submitting || !reason.trim() || isOverLimit}
              >
                {submitting ? '신고 중...' : '신고하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
