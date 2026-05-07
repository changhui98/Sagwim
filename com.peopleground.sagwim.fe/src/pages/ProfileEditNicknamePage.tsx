import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, updateMyProfile } from '../api/userApi'
import { checkNickname } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { Navbar } from '../components/Navbar'
import { AlertDialog } from '../components/common/AlertDialog'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import type { UserDetailResponse } from '../types/user'
import styles from '../components/profile/ProfileEditModal.module.css'
import pageStyles from './ProfileEditPage.module.css'

export function ProfileEditNicknamePage() {
  const navigate = useNavigate()
  const { token, logout, setMeProfile } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [profile, setProfile] = useState<UserDetailResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const [nickname, setNickname] = useState('')
  const [isNicknameChecked, setIsNicknameChecked] = useState(false)
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertVariant, setAlertVariant] = useState<'success' | 'error'>('success')
  const [alertMessage, setAlertMessage] = useState('')

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  useEffect(() => {
    let cancelled = false
    setProfileLoading(true)
    getMyProfile(token)
      .then((res) => {
        if (cancelled) return
        setProfile(res)
        setNickname(res.nickname)
      })
      .catch((err) => {
        if (!cancelled) handleUnauthorized(err)
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, handleUnauthorized])

  const isNicknameChanged = profile !== null && nickname.trim() !== profile.nickname.trim()

  const isSaveEnabled = isNicknameChanged && isNicknameChecked && isNicknameAvailable

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value)
    // 입력값이 바뀌면 중복확인 상태 초기화
    setIsNicknameChecked(false)
    setIsNicknameAvailable(false)
  }

  const handleCheckNickname = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) return

    try {
      const available = await checkNickname(trimmed)
      setIsNicknameChecked(true)
      setIsNicknameAvailable(available)
      setAlertVariant(available ? 'success' : 'error')
      setAlertMessage(available ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.')
      setAlertOpen(true)
    } catch {
      setAlertVariant('error')
      setAlertMessage('중복 확인 중 오류가 발생했습니다. 다시 시도해주세요.')
      setAlertOpen(true)
    }
  }

  const handleSaveClick = () => {
    if (!isSaveEnabled) return
    setShowConfirm(true)
  }

  const handleConfirmSave = async () => {
    if (!profile) return
    setShowConfirm(false)
    setIsSaving(true)

    try {
      const updated = await updateMyProfile(token, {
        nickname: nickname.trim(),
        address: profile.address ?? '',
        currentPassword: '',
        newPassword: '',
        profileImageUrl: profile.profileImageUrl ?? null,
        bio: profile.bio ?? '',
      })
      setMeProfile(updated)
      navigate('/app/profile/edit')
    } catch (err) {
      handleUnauthorized(err)
      setAlertVariant('error')
      setAlertMessage('닉네임 저장에 실패했습니다. 다시 시도해주세요.')
      setAlertOpen(true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = useCallback(() => {
    navigate(-1)
  }, [navigate])

  if (profileLoading) {
    return (
      <>
        <Navbar role={null} onLogout={handleLogout} />
        <main className={pageStyles.main}>
          <p className={pageStyles.loading}>프로필을 불러오는 중…</p>
        </main>
      </>
    )
  }

  if (!profile) return null

  return (
    <>
      <Navbar role={profile.role ?? null} onLogout={handleLogout} />

      <main className={pageStyles.main}>
        <div className={pageStyles.container}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.headerBtn}
            onClick={handleCancel}
            disabled={isSaving}
          >
            취소
          </button>
          <h1 className={styles.title}>닉네임</h1>
          <button
            type="button"
            className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
            onClick={handleSaveClick}
            disabled={!isSaveEnabled || isSaving}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </header>

        <div className="input-group" style={{ padding: 'var(--sp-5)' }}>
          <label className="input-label" htmlFor="nickname-input">
            닉네임
          </label>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
            <input
              id="nickname-input"
              type="text"
              className="input"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="닉네임을 입력하세요"
              disabled={isSaving}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCheckNickname}
              disabled={!isNicknameChanged || nickname.trim().length === 0 || isSaving}
              style={{ flexShrink: 0 }}
            >
              중복확인
            </button>
          </div>
          {isNicknameChanged && !isNicknameChecked && nickname.trim().length > 0 && (
            <p style={{ margin: 'var(--sp-1) 0 0', fontSize: '0.875rem', color: 'var(--clr-text-secondary)' }}>
              닉네임을 변경하려면 중복 확인이 필요합니다.
            </p>
          )}
          <div style={{ marginTop: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-secondary)', margin: 0 }}>
              닉네임은 7일 동안 최대 두 번까지 변경할 수 있습니다.
            </p>
          </div>
        </div>
        </div>
      </main>

      <AlertDialog
        isOpen={alertOpen}
        variant={alertVariant}
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />

      <ConfirmDialog
        isOpen={showConfirm}
        title="닉네임 변경"
        message={`닉네임을 "${nickname.trim()}"으로 변경하시겠습니까?`}
        confirmLabel="변경"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
