import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, updateMyProfile } from '../api/userApi'
import { uploadUserProfileImage } from '../api/imageApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { Navbar } from '../components/Navbar'
import type { Gender, UserDetailResponse } from '../types/user'

function genderLabel(gender?: Gender): string {
  if (gender === 'MALE') return '남성'
  if (gender === 'FEMALE') return '여성'
  return '선택 안 함'
}
import styles from '../components/profile/ProfileEditModal.module.css'
import pageStyles from './ProfileEditPage.module.css'

export function ProfileEditPage() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [profile, setProfile] = useState<UserDetailResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const [isSearchable, setIsSearchable] = useState(true)
  const [isSearchableLoading, setIsSearchableLoading] = useState(false)

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [avatarImgError, setAvatarImgError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setProfileImageUrl(res.profileImageUrl ?? null)
        setIsSearchable(res.isSearchable ?? true)
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

  const handleCancel = useCallback(() => {
    navigate('/app/profile')
  }, [navigate])

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    setImageError(null)

    try {
      setImageUploading(true)
      const result = await uploadUserProfileImage(token, file, profile.id)
      setProfileImageUrl(result.fileUrl)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.')
      setImagePreview(null)
    } finally {
      setImageUploading(false)
    }
  }

  const handleEditNickname = useCallback(() => {
    navigate('/app/profile/edit/nickname')
  }, [navigate])

  const handleToggleSearchable = useCallback(async () => {
    if (!profile || !token) return
    const next = !isSearchable
    setIsSearchable(next)
    setIsSearchableLoading(true)
    try {
      await updateMyProfile(token, {
        nickname: profile.nickname,
        address: profile.address ?? '',
        currentPassword: '',
        newPassword: '',
        profileImageUrl: profileImageUrl,
        bio: profile.bio,
        gender: profile.gender,
        birthDate: profile.birthDate,
        isSearchable: next,
      })
    } catch (err) {
      // 저장 실패 시 롤백
      setIsSearchable(!next)
      handleUnauthorized(err)
    } finally {
      setIsSearchableLoading(false)
    }
  }, [profile, token, isSearchable, profileImageUrl, handleUnauthorized])

  const currentImageSrc = imagePreview ?? profileImageUrl

  useEffect(() => {
    setAvatarImgError(false)
  }, [currentImageSrc])

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
            >
              돌아가기
            </button>
            <h1 id="profile-edit-page-title" className={styles.title}>
              프로필 편집
            </h1>
            <span style={{ minWidth: '4rem' }} />
          </header>

          {/* 사진 섹션 */}
          <div className={styles.imageSection}>
            <div className={styles.avatarWrapper}>
              {currentImageSrc && !avatarImgError ? (
                <img
                  src={currentImageSrc}
                  alt="프로필 이미지"
                  className={styles.avatarImg}
                  onError={() => setAvatarImgError(true)}
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
              disabled={imageUploading}
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

          {imageError && (
            <p className={styles.errorMessage} role="alert" style={{ margin: '0 var(--sp-5)' }}>
              {imageError}
            </p>
          )}

          <hr className={styles.imageDivider} />

          {/* 리스트 항목들 */}
          <ul className={pageStyles.settingList}>
            <li className={pageStyles.settingRow} style={{ cursor: 'default' }}>
              <span className={pageStyles.settingLabel}>아이디</span>
              <span className={pageStyles.settingValue}>{profile.username}</span>
            </li>
            <li className={pageStyles.settingRow} onClick={handleEditNickname}>
              <span className={pageStyles.settingLabel}>닉네임</span>
              <span className={pageStyles.settingValue}>{profile.nickname}</span>
              <span className={pageStyles.chevron}>›</span>
            </li>
            <li className={pageStyles.settingRow} style={{ cursor: 'default' }}>
              <span className={pageStyles.settingLabel}>닉네임 검색 허용</span>
              <label className={pageStyles.toggleLabel} style={{ marginLeft: 'auto' }}>
                <input
                  type="checkbox"
                  checked={isSearchable}
                  onChange={handleToggleSearchable}
                  disabled={isSearchableLoading}
                />
                <span className={pageStyles.toggleSlider} />
              </label>
            </li>
            <li className={pageStyles.settingRow} onClick={() => navigate('/app/profile/edit/gender')}>
              <span className={pageStyles.settingLabel}>성별</span>
              <span className={pageStyles.settingValue}>{genderLabel(profile.gender)}</span>
              <span className={pageStyles.chevron}>›</span>
            </li>
            <li className={pageStyles.settingRow} onClick={() => navigate('/app/profile/edit/birthdate')}>
              <span className={pageStyles.settingLabel}>생년월일</span>
              <span className={pageStyles.settingValue}>{profile.birthDate ?? '설정 안 됨'}</span>
              <span className={pageStyles.chevron}>›</span>
            </li>
            <li className={pageStyles.settingRow} onClick={() => navigate('/app/profile/edit/address')}>
              <span className={pageStyles.settingLabel}>주소</span>
              <span className={pageStyles.settingValue}>{profile.address || '설정 안 됨'}</span>
              <span className={pageStyles.chevron}>›</span>
            </li>
            <li className={pageStyles.settingRow} style={{ cursor: 'default' }}>
              <span className={pageStyles.settingLabel}>모임 노출 범위</span>
              <span className={pageStyles.settingValue}>{profile.exposureRangeKm != null ? `${profile.exposureRangeKm}km` : '1km'}</span>
            </li>
          </ul>
        </div>
      </main>
    </>
  )
}
