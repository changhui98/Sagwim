import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PasswordInput } from '../components/PasswordInput'
import { PasswordChecklist } from '../components/PasswordChecklist'
import { AlertDialog } from '../components/common/AlertDialog'
import { SuccessDialog } from '../components/common/SuccessDialog'
import { updateMyProfile } from '../api/userApi'
import { isPasswordValid, isConfirmPasswordValid } from '../utils/passwordRules'
import { ApiError } from '../api/ApiError'
import panelStyles from './SettingsPage.module.css'
import styles from './ChangePasswordPage.module.css'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)

  const canSubmit = useMemo(
    () =>
      currentPassword.length > 0 &&
      isPasswordValid(newPassword) &&
      isConfirmPasswordValid(newPassword, confirmPassword) &&
      !isSubmitting,
    [currentPassword, newPassword, confirmPassword, isSubmitting],
  )

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      await updateMyProfile(token, {
        nickname: '',
        address: '',
        currentPassword,
        newPassword,
      })
      setSuccessOpen(true)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : '비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해주세요.'
      setAlertMessage(message)
      setAlertOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }, [canSubmit, token, currentPassword, newPassword])

  const handleSuccessClose = useCallback(() => {
    setSuccessOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }, [])

  return (
    <>
      <div className={panelStyles.panelHeader}>
        <div className={panelStyles.panelTitleGroup}>
          <button
            type="button"
            className={styles.backLink}
            onClick={() => navigate('/app/settings')}
            aria-label="계정 보안 개요로 돌아가기"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            계정 보안
          </button>
          <h2 className={panelStyles.panelTitle}>비밀번호 변경</h2>
          <p className={panelStyles.panelSubtitle}>
            정기적인 비밀번호 변경으로 계정을 안전하게 보호하세요
          </p>
        </div>
      </div>

      <div className={panelStyles.formCard}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="current-password">
            현재 비밀번호
          </label>
          <PasswordInput
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호를 입력하세요"
            autoComplete="current-password"
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="new-password">
            새 비밀번호
          </label>
          <PasswordInput
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호를 입력하세요"
            autoComplete="new-password"
          />
          <PasswordChecklist password={newPassword} confirmPassword={confirmPassword} />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="confirm-password">
            새 비밀번호 확인
          </label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="새 비밀번호를 다시 입력하세요"
            autoComplete="new-password"
          />
        </div>

        <button
          type="button"
          className={`btn btn-primary btn-lg btn-full ${styles.submitBtn}`}
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
        >
          {isSubmitting ? '변경 중…' : '비밀번호 변경'}
        </button>
      </div>

      <AlertDialog
        isOpen={alertOpen}
        variant="error"
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />
      <SuccessDialog
        isOpen={successOpen}
        title="비밀번호가 변경되었어요"
        autoCloseMs={1600}
        onClose={handleSuccessClose}
      />
    </>
  )
}
