import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, updateMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { Navbar } from '../components/Navbar'
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
  const { token, logout, setMeProfile } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [profile, setProfile] = useState<UserDetailResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [selected, setSelected] = useState<Gender>('NONE')
  const [isSaving, setIsSaving] = useState(false)

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

  const isChanged = profile !== null && selected !== (profile.gender ?? 'NONE')

  const handleCancel = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const handleSave = async () => {
    if (!profile || !isChanged) return
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
      navigate('/app/profile/edit')
    } catch (err) {
      handleUnauthorized(err)
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
              취소
            </button>
            <h1 className={styles.title}>성별</h1>
            <button
              type="button"
              className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
              onClick={handleSave}
              disabled={!isChanged || isSaving}
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </header>

          <ul className={pageStyles.settingList}>
            {GENDER_OPTIONS.map((option) => (
              <li
                key={option.value}
                className={pageStyles.settingRow}
                onClick={() => setSelected(option.value)}
                style={{ cursor: 'pointer' }}
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
    </>
  )
}
