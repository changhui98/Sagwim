import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createDirectRoom } from '../api/chatApi'
import { getMyProfile, getUserProfile, updateMyProfile } from '../api/userApi'
import { getMyGroups } from '../api/groupApi'
import { uploadUserProfileImage } from '../api/imageApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { usePostCreatedSubscription } from '../context/PostCreateModalContext'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { MobileHeader } from '../components/MobileHeader'
import { Footer } from '../components/Footer'
import {
  MyPostsSection,
  type MyPostsSectionHandle,
} from '../components/profile/MyPostsSection'
import { JoinedGroupsSection } from '../components/profile/JoinedGroupsSection'
import { getInitials } from '../utils/stringUtils'
import { formatYearMonth } from '../utils/dateUtils'
import styles from './ProfilePage.module.css'
import type { UserDetailResponse } from '../types/user'
import type { GroupResponse } from '../types/group'
import { ApiError } from '../api/ApiError'

export function ProfilePage() {
  const navigate = useNavigate()
  const { username } = useParams<{ username?: string }>()
  const { token, setMeProfile } = useAuth()
  const handleLogout = useLogout()

  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [viewerProfile, setViewerProfile] = useState<UserDetailResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarImgError, setAvatarImgError] = useState(false)
  // 백엔드가 slice 응답(totalElements 없음)이라 카운트는 "로드된 개수 + 더보기(+)" 로 표시한다.
  const [postStats, setPostStats] = useState<{ count: number; hasMore: boolean } | null>(null)
  const [myGroups, setMyGroups] = useState<GroupResponse[]>([])
  const [groupsHaveMore, setGroupsHaveMore] = useState(false)
  const myPostsRef = useRef<MyPostsSectionHandle | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const isOwner = !!viewerProfile && !!myProfile && viewerProfile.username === myProfile.username

  const handleUnauthorized = useHandleUnauthorized()

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      setProfileError('')
      if (username) {
        const [viewerResponse, targetResponse] = await Promise.all([
          getMyProfile(token),
          getUserProfile(token, username),
        ])
        setViewerProfile(viewerResponse)
        setMyProfile(targetResponse)
        setMeProfile(viewerResponse)
      } else {
        const response = await getMyProfile(token)
        setViewerProfile(response)
        setMyProfile(response)
        setMeProfile(response)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로필 조회 실패'
      setProfileError(message)
      handleUnauthorized(err)
    } finally {
      setProfileLoading(false)
    }
  }, [token, handleUnauthorized, username, setMeProfile])

  const handleAvatarPick = useCallback(() => {
    if (!isOwner || avatarUploading || !myProfile) return
    avatarInputRef.current?.click()
  }, [avatarUploading, isOwner, myProfile])

  const handleAvatarChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (!myProfile) return
      const file = e.target.files?.[0]
      e.currentTarget.value = ''
      if (!file) return

      try {
        setAvatarUploading(true)
        setProfileError('')
        const uploaded = await uploadUserProfileImage(token, file, myProfile.id)
        const updated = await updateMyProfile(token, {
          nickname: myProfile.nickname,
          address: myProfile.address,
          currentPassword: '',
          newPassword: '',
          profileImageUrl: uploaded.fileUrl,
        })
        setMyProfile(updated)
        if (viewerProfile?.username === updated.username) {
          setViewerProfile(updated)
        }
        setMeProfile(updated)
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message || '프로필 이미지 변경에 실패했습니다.'
            : '프로필 이미지 변경에 실패했습니다.'
        setProfileError(message)
        handleUnauthorized(err)
      } finally {
        setAvatarUploading(false)
      }
    },
    [myProfile, token, viewerProfile, handleUnauthorized, setMeProfile],
  )

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    setAvatarImgError(false)
  }, [myProfile?.profileImageUrl])

  // 프로필 대상이 바뀌면 게시글 수를 리셋한다. (MyPostsSection 콜백으로 다시 채워짐)
  useEffect(() => {
    setPostStats(null)
  }, [username])

  // 가입한 모임: /groups/me 는 본인 전용이므로 내 프로필일 때만 조회한다.
  useEffect(() => {
    if (!isOwner) {
      setMyGroups([])
      setGroupsHaveMore(false)
      return
    }
    let cancelled = false
    getMyGroups(token, 0, 20)
      .then((res) => {
        if (cancelled) return
        setMyGroups(res.content)
        setGroupsHaveMore(res.hasNext)
      })
      .catch((err) => {
        // 모임 조회 실패는 섹션 숨김으로 충분 — 인증 만료만 처리
        if (!cancelled) handleUnauthorized(err)
      })
    return () => {
      cancelled = true
    }
  }, [isOwner, token, handleUnauthorized])

  // 새 글 작성 플로우가 완료되면 내 글 목록을 최신화한다.
  usePostCreatedSubscription(
    useCallback(() => {
      myPostsRef.current?.refresh()
    }, []),
  )

  const goProfileEdit = useCallback(() => {
    navigate('/app/settings/profile')
  }, [navigate])

  const handlePostCountChange = useCallback((count: number, hasMore: boolean) => {
    setPostStats({ count, hasMore })
  }, [])

  return (
    <>
      <Navbar role={viewerProfile?.role ?? null} onLogout={handleLogout} />
      <Header role={viewerProfile?.role ?? null} onLogout={handleLogout} />
      <MobileHeader onLogout={handleLogout} />

      <main className={styles.main}>
        {profileError && (
          <p className="alert alert-error" role="alert">{profileError}</p>
        )}

        {/* ── 프로필 헤더 카드: 커버 배너 + 오버랩 아바타 ── */}
        <section className={styles.profileHeader} aria-label={isOwner ? '내 프로필' : '사용자 프로필'}>
          <div className={styles.coverBanner} aria-hidden="true" />
          <div className={styles.headerBody}>
            <div className={styles.avatarWrap}>
              <button
                type="button"
                className={styles.avatarButton}
                onClick={handleAvatarPick}
                disabled={!isOwner || avatarUploading || !myProfile}
                aria-label={isOwner ? '프로필 사진 변경' : '프로필 사진'}
              >
                {myProfile?.profileImageUrl && !avatarImgError ? (
                  <img
                    src={myProfile.profileImageUrl}
                    alt={`${myProfile.nickname} 프로필 이미지`}
                    className={styles.avatarImage}
                    onError={() => setAvatarImgError(true)}
                  />
                ) : (
                  <span className={`avatar ${styles.avatarLg}`}>
                    {myProfile ? getInitials(myProfile.nickname) : '··'}
                  </span>
                )}
              </button>
              {isOwner && (
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.avatarInput}
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
              )}
            </div>

            <div className={styles.headerInfo}>
              <h1 className={styles.displayName}>
                {myProfile?.nickname ?? ' '}
              </h1>

              <p
                className={`${styles.bio} ${isOwner ? styles.bioClickable : ''}`}
                onClick={isOwner ? goProfileEdit : undefined}
                title={isOwner ? '클릭하여 한 줄 소개 수정' : undefined}
              >
                {myProfile?.bio
                  ? myProfile.bio
                  : isOwner
                    ? '한 줄 소개를 작성해보세요.'
                    : ''}
              </p>

              <div className={styles.statsRow}>
                <span className={styles.stat}>
                  게시글 <strong>{postStats ? `${postStats.count}${postStats.hasMore ? '+' : ''}` : '–'}</strong>
                </span>
                {isOwner && myGroups.length > 0 && (
                  <>
                    <span className={styles.statDot} aria-hidden="true">·</span>
                    <span className={styles.stat}>
                      모임 <strong>{`${myGroups.length}${groupsHaveMore ? '+' : ''}`}</strong>
                    </span>
                  </>
                )}
                {myProfile?.createdAt && (
                  <>
                    <span className={styles.statDot} aria-hidden="true">·</span>
                    <span className={styles.stat}>
                      가입일 <strong>{formatYearMonth(myProfile.createdAt)}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className={styles.headerActions}>
              {isOwner ? (
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={goProfileEdit}
                  disabled={!myProfile || profileLoading}
                >
                  프로필 편집
                </button>
              ) : myProfile && viewerProfile ? (
                <>
                  <button type="button" className={`${styles.socialButton} ${styles.followButton}`}>
                    팔로우
                  </button>
                  <button
                    type="button"
                    className={styles.socialButton}
                    onClick={async () => {
                      try {
                        const room = await createDirectRoom(token, myProfile.id)
                        navigate(`/app/messages/${room.roomId}`)
                      } catch {
                        // 에러 무시 (이미 방이 존재하면 그 방으로 이동)
                      }
                    }}
                  >
                    메시지 보내기
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* ── 가입한 모임 (본인 프로필 + 1개 이상일 때만) ── */}
        {isOwner && myGroups.length > 0 && (
          <div className={styles.groupsSection}>
            <JoinedGroupsSection
              groups={myGroups}
              onGroupClick={(groupId) => navigate(`/app/groups/${groupId}`)}
            />
          </div>
        )}

        {/* ── 내가 작성한 글 ── */}
        <MyPostsSection
          ref={myPostsRef}
          username={username}
          isOwner={isOwner}
          onUnauthorized={handleUnauthorized}
          onCountChange={handlePostCountChange}
        />
      </main>

      <Footer />
    </>
  )
}
