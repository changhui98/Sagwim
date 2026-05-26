import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, updateMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { AlertDialog } from '../components/common/AlertDialog'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import type { Gender, UserDetailResponse } from '../types/user'
import styles from '../components/profile/ProfileEditModal.module.css'
import pageStyles from './ProfileEditPage.module.css'

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
  { value: 'NONE', label: '선택 안 함' },
]

export function ProfileEditGenderPage() {
  const navigate = useNavigate()
  const { token, setMeProfile } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()
  const handleLogout = useLogout()

  const [profile, setProfile] = useState<UserDetailResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [selected, setSelected] = useState<Gender>('NONE')
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    setProfileLoading(true)
    getMyProfile(token)
      .then((res) => {
        if (cancelled) return
        setProfile(res)
        setSelected(res.gender ?? 'NONE')
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

  const isGenderChanged = profile !== null && selected !== (profile.gender ?? 'NONE')

  const handleCancel = useCallback(() => {
    if (isGenderChanged) {
      setShowConfirm(true)
      return
    }
    navigate('/app/profile/edit', { replace: true })
  }, [isGenderChanged, navigate])

  const handleConfirmDiscard = () => {
    setShowConfirm(false)
    navigate('/app/profile/edit', { replace: true })
  }

  const handleSelectGender = (value: Gender) => {
    if (isSaving) return
    setSelected(value)
  }

  const handleSave = async () => {
    if (!profile || !isGenderChanged) return
    setIsSaving(true)
    try {
      const updated = await updateMyProfile(token, {
        nickname: profile.nickname,
        address: profile.address ?? '',
        currentPassword: '',
        newPassword: '',
        profileImageUrl: profile.profileImageUrl ?? null,
        bio: profile.bio ?? '',
        gender: selected,
        birthDate: profile.birthDate ?? null,
      })
      setMeProfile(updated)
      navigate('/app/profile/edit', { replace: true })
    } catch (err) {
      handleUnauthorized(err)
      setAlertMessage('성별 저장에 실패했습니다. 다시 시도해주세요.')
      setAlertOpen(true)
    } finally {
      setIsSaving(false)
    }
  }

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
              돌아가기
            </button>
            <h1 className={styles.title}>성별</h1>
            <button
              type="button"
              className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
              onClick={handleSave}
              disabled={!isGenderChanged || isSaving}
            >
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          </header>

          <ul className={pageStyles.settingList}>
            {GENDER_OPTIONS.map((option) => (
              <li
                key={option.value}
                className={pageStyles.settingRow}
                onClick={() => handleSelectGender(option.value)}
                style={{ cursor: isSaving ? 'default' : 'pointer' }}
              >
                <span className={pageStyles.settingLabel}>{option.label}</span>
                {selected === option.value && (
                  <span style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>✓</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <AlertDialog
        isOpen={alertOpen}
        variant="error"
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />

      <ConfirmDialog
        isOpen={showConfirm}
        title="변경 취소"
        message="변경 사항이 사라집니다. 계속하시겠습니까?"
        confirmLabel="나가기"
        cancelLabel="계속 편집"
        confirmVariant="danger"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
