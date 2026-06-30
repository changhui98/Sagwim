import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, updateMyProfile } from '../api/userApi'
import { uploadUserProfileImage } from '../api/imageApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import type { Gender, UserDetailResponse } from '../types/user'
import styles from './SettingsPage.module.css'
import pageStyles from './ProfileEditPage.module.css'

function genderLabel(gender?: Gender): string {
  if (gender === 'MALE') return '남성'
  if (gender === 'FEMALE') return '여성'
  return '선택 안 함'
}

function ChevronRight() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function SettingsProfilePage() {
  const navigate = useNavigate()
  const { token } = useAuth()
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
  const imagePreviewRef = useRef<string | null>(null)

  useEffect(() => {
    imagePreviewRef.current = imagePreview
  }, [imagePreview])

  // 컴포넌트 unmount 시 미해제된 blob URL 정리
  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current)
      }
    }
  }, [])

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

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // 기존 preview blob URL 해제
    if (imagePreviewRef.current) {
      URL.revokeObjectURL(imagePreviewRef.current)
    }
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    setImageError(null)

    try {
      setImageUploading(true)
      const result = await uploadUserProfileImage(token, file, profile.id)
      setProfileImageUrl(result.fileUrl)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.')
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current)
      }
      setImagePreview(null)
    } finally {
      setImageUploading(false)
    }
  }

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

  const goEdit = useCallback(
    (slug: string) => {
      navigate(`/app/settings/profile/${slug}`)
    },
    [navigate],
  )

  const currentImageSrc = imagePreview ?? profileImageUrl

  useEffect(() => {
    setAvatarImgError(false)
  }, [currentImageSrc])

  return (
    <>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <h2 className={styles.panelTitle}>프로필 수정</h2>
          <p className={styles.panelSubtitle}>
            프로필 사진과 기본 정보를 관리합니다
          </p>
        </div>
      </div>

      {profileLoading || !profile ? (
        <p className={pageStyles.loading}>프로필을 불러오는 중…</p>
      ) : (
        <>
          {/* ── 프로필 히어로 (큰 아바타 + 이름) ── */}
          <div className={styles.profileHero}>
            <div className={styles.profileAvatar}>
              {currentImageSrc && !avatarImgError ? (
                <img
                  src={currentImageSrc}
                  alt="프로필 이미지"
                  className={styles.profileAvatarImg}
                  onError={() => setAvatarImgError(true)}
                />
              ) : (
                <div className={styles.profileAvatarPlaceholder}>
                  {profile.nickname.charAt(0).toUpperCase()}
                </div>
              )}
              {imageUploading && (
                <div className={styles.profileAvatarOverlay}>
                  <span className={styles.profileAvatarOverlayText}>업로드 중…</span>
                </div>
              )}
            </div>
            <p className={styles.profileHeroName}>{profile.nickname}</p>
            <p className={styles.profileHeroUsername}>@{profile.username}</p>
            <button
              type="button"
              className={`btn btn-secondary ${styles.profileImageChangeBtn}`}
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
            {imageError && (
              <p className={styles.profileImageError} role="alert">
                {imageError}
              </p>
            )}
          </div>

          {/* ── 기본 정보 2열 카드 그리드 ── */}
          <div className={styles.profileGrid}>
            <button
              type="button"
              className={styles.profileCard}
              onClick={() => goEdit('nickname')}
            >
              <span className={styles.profileCardLabel}>닉네임</span>
              <span className={styles.profileCardValue}>{profile.nickname}</span>
              <span className={styles.profileCardChevron}>
                <ChevronRight />
              </span>
            </button>
            <button
              type="button"
              className={styles.profileCard}
              onClick={() => goEdit('gender')}
            >
              <span className={styles.profileCardLabel}>성별</span>
              <span className={styles.profileCardValue}>{genderLabel(profile.gender)}</span>
              <span className={styles.profileCardChevron}>
                <ChevronRight />
              </span>
            </button>
            <button
              type="button"
              className={styles.profileCard}
              onClick={() => goEdit('birthdate')}
            >
              <span className={styles.profileCardLabel}>생년월일</span>
              <span className={styles.profileCardValue}>{profile.birthDate ?? '설정 안 됨'}</span>
              <span className={styles.profileCardChevron}>
                <ChevronRight />
              </span>
            </button>
            <button
              type="button"
              className={styles.profileCard}
              onClick={() => goEdit('address')}
            >
              <span className={styles.profileCardLabel}>주소</span>
              <span className={styles.profileCardValue}>{profile.address || '설정 안 됨'}</span>
              <span className={styles.profileCardChevron}>
                <ChevronRight />
              </span>
            </button>

            {/* 닉네임 검색 허용 토글 (전체 폭) */}
            <div className={`${styles.profileCardStatic} ${styles.profileCardFull}`}>
              <span className={styles.profileCardLabel}>닉네임 검색 허용</span>
              <label className={pageStyles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={isSearchable}
                  onChange={handleToggleSearchable}
                  disabled={isSearchableLoading}
                />
                <span className={pageStyles.toggleSlider} />
              </label>
            </div>

            {/* 읽기 전용 */}
            <div className={styles.profileCardStatic}>
              <span className={styles.profileCardLabel}>아이디</span>
              <span className={styles.profileCardValue}>{profile.username}</span>
            </div>
            <div className={styles.profileCardStatic}>
              <span className={styles.profileCardLabel}>모임 노출 범위</span>
              <span className={styles.profileCardValue}>
                {profile.exposureRangeKm != null ? `${profile.exposureRangeKm}km` : '1km'}
              </span>
            </div>
          </div>
        </>
      )}
    </>
  )
}
