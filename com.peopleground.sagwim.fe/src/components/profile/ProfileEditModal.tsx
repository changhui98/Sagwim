import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  confirmEmailChange,
  requestEmailChangeVerification,
  updateMyProfile,
} from '../../api/userApi'
import { uploadUserProfileImage } from '../../api/imageApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { PasswordInput } from '../PasswordInput'
import { PasswordChecklist } from '../PasswordChecklist'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { SuccessDialog } from '../common/SuccessDialog'
import { KakaoAddressSearch } from '../common/KakaoAddressSearch'
import { isPasswordValid } from '../../utils/passwordRules'
import type { UserDetailResponse } from '../../types/user'
import styles from './ProfileEditModal.module.css'

interface ProfileEditModalProps {
  isOpen: boolean
  profile: UserDetailResponse | null
  onClose: () => void
  onSaved: (updated: UserDetailResponse) => void
  onUnauthorized?: (err: unknown) => void
}

interface EditFormState {
  nickname: string
  address: string
  currentPassword: string
  newPassword: string
  profileImageUrl: string | null
}

const buildInitialForm = (profile: UserDetailResponse | null): EditFormState => ({
  nickname: profile?.nickname ?? '',
  address: profile?.address ?? '',
  currentPassword: '',
  newPassword: '',
  profileImageUrl: profile?.profileImageUrl ?? null,
})

export function ProfileEditModal({
  isOpen,
  profile,
  onClose,
  onSaved,
  onUnauthorized,
}: ProfileEditModalProps) {
  const { token } = useAuth()
  const [form, setForm] = useState<EditFormState>(buildInitialForm(null))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [savedProfile, setSavedProfile] = useState<UserDetailResponse | null>(null)

  // 이메일 변경 전용 상태 (별도 인증 플로우)
  // 보안: 이메일은 프로필 PATCH로 변경되지 않고, 새 이메일로 발송된 6자리 코드를
  // 검증해야만 변경된다. 검증 성공 시 즉시 백엔드에서 이메일이 갱신되며,
  // 클라이언트는 displayedEmail에 이를 반영한다.
  const [displayedEmail, setDisplayedEmail] = useState<string>(profile?.userEmail ?? '')
  const [emailDraft, setEmailDraft] = useState<string>('')
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [emailCode, setEmailCode] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailVerifying, setEmailVerifying] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setForm(buildInitialForm(profile))
    setError(null)
    setSubmitting(false)
    setConfirmOpen(false)
    setSuccessOpen(false)
    setSavedProfile(null)
    setImagePreview(null)
    setImageUploading(false)

    setDisplayedEmail(profile?.userEmail ?? '')
    setEmailDraft('')
    setEmailCodeSent(false)
    setEmailCode('')
    setEmailSending(false)
    setEmailVerifying(false)
    setEmailMessage(null)
  }, [isOpen, profile])

  const handleClose = useCallback(() => {
    if (submitting) return
    if (emailSending || emailVerifying) return
    if (confirmOpen || successOpen) return
    onClose()
  }, [submitting, emailSending, emailVerifying, confirmOpen, successOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, handleClose])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen || !profile) return null

  const isSocialUser = profile.provider != null && profile.provider !== 'LOCAL'

  const nicknameValid = form.nickname.trim().length > 0
  const wantsPasswordChange =
    !isSocialUser && (form.newPassword.length > 0 || form.currentPassword.length > 0)
  const passwordChangeValid = wantsPasswordChange
    ? form.currentPassword.length > 0 && isPasswordValid(form.newPassword)
    : true
  const isValid = nicknameValid && passwordChangeValid

  // 이메일 형식 검증 (간단한 규칙)
  const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.trim())
  const canSendEmailCode =
    isEmailFormatValid &&
    emailDraft.trim().toLowerCase() !== displayedEmail.trim().toLowerCase() &&
    !emailSending

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValid || submitting) return
    setError(null)
    setConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const updated = await updateMyProfile(token, {
        ...form,
        profileImageUrl: form.profileImageUrl ?? null,
      })
      setSavedProfile(updated)
      setConfirmOpen(false)
      setSuccessOpen(true)
    } catch (err) {
      setConfirmOpen(false)
      if (err instanceof ApiError) {
        setError(err.message || '프로필 수정에 실패했습니다. 다시 시도해 주세요.')
        onUnauthorized?.(err)
      } else {
        setError('프로필 수정에 실패했습니다. 다시 시도해 주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setSuccessOpen(false)
    if (savedProfile) onSaved(savedProfile)
    onClose()
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)

    try {
      setImageUploading(true)
      const result = await uploadUserProfileImage(token, file, profile.id)
      setForm((prev) => ({ ...prev, profileImageUrl: result.fileUrl }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.')
      setImagePreview(null)
    } finally {
      setImageUploading(false)
    }
  }

  const handleSendEmailCode = async () => {
    if (!canSendEmailCode || emailSending) return
    setEmailMessage(null)
    setEmailSending(true)
    try {
      await requestEmailChangeVerification(token, { newEmail: emailDraft.trim() })
      setEmailCodeSent(true)
      setEmailCode('')
      setEmailMessage({ type: 'info', text: '입력하신 이메일로 인증코드를 발송했습니다.' })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '인증코드 발송에 실패했습니다.'
      setEmailMessage({ type: 'error', text: msg })
      if (err instanceof ApiError) onUnauthorized?.(err)
    } finally {
      setEmailSending(false)
    }
  }

  const handleVerifyEmailCode = async () => {
    if (!emailCode.trim() || emailVerifying) return
    setEmailMessage(null)
    setEmailVerifying(true)
    try {
      const newEmail = emailDraft.trim()
      await confirmEmailChange(token, { newEmail, code: emailCode.trim() })
      setDisplayedEmail(newEmail)
      setEmailDraft('')
      setEmailCode('')
      setEmailCodeSent(false)
      setEmailMessage({ type: 'success', text: '이메일이 변경되었습니다.' })
      // 부모에 즉시 반영하여 프로필 화면도 새 이메일을 노출하도록 한다.
      onSaved({ ...profile, userEmail: newEmail })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '인증코드 확인에 실패했습니다.'
      setEmailMessage({ type: 'error', text: msg })
      if (err instanceof ApiError) onUnauthorized?.(err)
    } finally {
      setEmailVerifying(false)
    }
  }

  const currentImageSrc = imagePreview ?? form.profileImageUrl

  const newPasswordFilled = form.newPassword.length > 0
  const newPwValid = isPasswordValid(form.newPassword)

  return createPortal(
    <>
      <div
        className={styles.overlay}
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-modal-title"
      >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.headerBtn}
            onClick={handleClose}
            disabled={submitting}
          >
            취소
          </button>
          <h2 id="profile-edit-modal-title" className={styles.title}>
            프로필 편집
          </h2>
          <button
            type="submit"
            form="profile-edit-modal-form"
            className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
            disabled={!isValid || submitting}
          >
            {submitting ? '저장 중…' : '저장'}
          </button>
        </header>

        <form
          id="profile-edit-modal-form"
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <p className={styles.hint}>
            이메일·주소 등 비공개 정보는 이 화면에서만 표시·수정됩니다.
          </p>

          {/* 프로필 이미지 */}
          <div className={styles.imageSection}>
            <div className={styles.avatarWrapper}>
              {currentImageSrc ? (
                <img
                  src={currentImageSrc}
                  alt="프로필 이미지"
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {profile.nickname.charAt(0).toUpperCase()}
                </div>
              )}
              {imageUploading && (
                <div className={styles.avatarOverlay}>
                  <span className={styles.avatarOverlayText}>업로드 중…</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className={`btn btn-secondary ${styles.imageChangeBtn}`}
              disabled={submitting || imageUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              사진 변경
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFileInput}
              onChange={handleImageFileChange}
            />
          </div>

          <div className={styles.formGrid}>
            <div className="input-group">
              <label className="input-label" htmlFor="edit-nickname">닉네임</label>
              <input
                id="edit-nickname"
                className="input"
                placeholder="새 닉네임"
                value={form.nickname}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nickname: e.target.value }))
                }
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className={`input-group ${styles.colSpan2}`}>
              <label className="input-label" htmlFor="edit-address">주소</label>
              <KakaoAddressSearch
                id="edit-address"
                address={form.address}
                onChange={(value) => setForm((prev) => ({ ...prev, address: value }))}
                disabled={submitting}
              />
            </div>

            {/* ── 이메일 변경 (별도 인증 플로우) ─────────────────────── */}
            <div className={`input-group ${styles.colSpan2}`}>
              <div className={styles.sectionDivider}>
                <span>이메일 변경</span>
                <span className={styles.sectionDividerNote}>
                  변경 시에만 인증코드를 받아 진행하세요
                </span>
              </div>
            </div>

            <div className={`input-group ${styles.colSpan2}`}>
              <label className="input-label" htmlFor="edit-current-email">현재 이메일</label>
              <input
                id="edit-current-email"
                className="input"
                type="email"
                value={displayedEmail}
                disabled
                readOnly
              />
            </div>

            <div className={`input-group ${styles.colSpan2}`}>
              <label className="input-label" htmlFor="edit-new-email">새 이메일</label>
              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                <input
                  id="edit-new-email"
                  className="input"
                  type="email"
                  placeholder="name@example.com"
                  value={emailDraft}
                  onChange={(e) => {
                    setEmailDraft(e.target.value)
                    if (emailCodeSent) {
                      // 새 이메일을 다시 입력하면 기존 코드 단계 초기화
                      setEmailCodeSent(false)
                      setEmailCode('')
                      setEmailMessage(null)
                    }
                  }}
                  disabled={submitting || emailSending || emailVerifying}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={!canSendEmailCode || emailVerifying}
                  onClick={handleSendEmailCode}
                >
                  {emailSending ? '발송 중…' : emailCodeSent ? '재발송' : '인증코드 전송'}
                </button>
              </div>
            </div>

            {emailCodeSent && (
              <div className={`input-group ${styles.colSpan2}`}>
                <label className="input-label" htmlFor="edit-email-code">인증코드</label>
                <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                  <input
                    id="edit-email-code"
                    className="input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6자리 코드"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    disabled={emailVerifying}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!emailCode.trim() || emailVerifying}
                    onClick={handleVerifyEmailCode}
                  >
                    {emailVerifying ? '확인 중…' : '인증코드 확인'}
                  </button>
                </div>
              </div>
            )}

            {emailMessage && (
              <div className={`input-group ${styles.colSpan2}`}>
                <p
                  className={
                    emailMessage.type === 'error'
                      ? styles.errorMessage
                      : styles.hint
                  }
                  style={
                    emailMessage.type === 'success'
                      ? { color: 'var(--clr-success, #16a34a)' }
                      : undefined
                  }
                  role={emailMessage.type === 'error' ? 'alert' : 'status'}
                >
                  {emailMessage.text}
                </p>
              </div>
            )}

            {!isSocialUser && (
              <>
                <div className={`input-group ${styles.colSpan2}`}>
                  <div className={styles.sectionDivider}>
                    <span>비밀번호 변경</span>
                    <span className={styles.sectionDividerNote}>
                      변경 시에만 입력하세요
                    </span>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="edit-cur-pw">현재 비밀번호</label>
                  <PasswordInput
                    id="edit-cur-pw"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={form.currentPassword}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                    }
                    disabled={submitting}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="edit-new-pw">새 비밀번호</label>
                  <PasswordInput
                    id="edit-new-pw"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={form.newPassword}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                    disabled={submitting}
                    className={
                      newPasswordFilled
                        ? newPwValid ? styles.pwValid : styles.pwInvalid
                        : undefined
                    }
                  />
                </div>
              </>
            )}
          </div>

          {!isSocialUser && newPasswordFilled && (
            <PasswordChecklist password={form.newPassword} />
          )}

          {error && <p className={styles.errorMessage}>{error}</p>}
        </form>
      </div>
    </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="프로필 수정"
        message="프로필 수정을 하시겠습니까?"
        confirmLabel="수정"
        cancelLabel="취소"
        isLoading={submitting}
        onConfirm={handleConfirmSave}
        onCancel={() => {
          if (!submitting) setConfirmOpen(false)
        }}
      />

      <SuccessDialog
        isOpen={successOpen}
        title="프로필이 수정되었습니다"
        message="변경한 정보가 저장되었어요."
        onClose={handleSuccessClose}
      />
    </>,
    document.body
  )
}
