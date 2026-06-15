import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { PasswordInput } from '../components/PasswordInput'
import { PasswordChecklist } from '../components/PasswordChecklist'
import { AlertDialog } from '../components/common/AlertDialog'
import { SuccessDialog } from '../components/common/SuccessDialog'
import { updateMyProfile } from '../api/userApi'
import { isPasswordValid, isConfirmPasswordValid } from '../utils/passwordRules'
import { ApiError } from '../api/ApiError'
import styles from '../components/profile/ProfileEditModal.module.css'
import pageStyles from './ChangePasswordPage.module.css'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { token, meRole } = useAuth()
  useHandleUnauthorized()
  const handleLogout = useLogout()

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
    navigate(-1)
  }, [navigate])

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <Header role={meRole} onLogout={handleLogout} />

      <main className={pageStyles.main}>
        <div className={pageStyles.container}>
          <header className={styles.header}>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={() => navigate(-1)}
            >
              돌아가기
            </button>
            <h1 className={styles.title}>비밀번호 변경</h1>
            <span style={{ minWidth: '4rem' }} />
          </header>

          <div className={pageStyles.body}>
            <div className={pageStyles.fieldGroup}>
              <label className={pageStyles.label} htmlFor="current-password">
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

            <div className={pageStyles.fieldGroup}>
              <label className={pageStyles.label} htmlFor="new-password">
                새 비밀번호
              </label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요"
                autoComplete="new-password"
              />
              <PasswordChecklist
                password={newPassword}
                confirmPassword={confirmPassword}
              />
            </div>

            <div className={pageStyles.fieldGroup}>
              <label className={pageStyles.label} htmlFor="confirm-password">
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
              className={pageStyles.submitBtn}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {isSubmitting ? '변경 중…' : '비밀번호 변경'}
            </button>
          </div>
        </div>
      </main>

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
