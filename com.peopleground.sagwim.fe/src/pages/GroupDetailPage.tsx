import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getGroup, getGroupMembers, joinGroup, leaveGroup, kickGroupMember, toggleGroupLike, getGroupLikeStatus, getMyJoinRequestStatus, cancelMyJoinRequest } from '../api/groupApi'
import { GroupLikersModal } from '../components/group/GroupLikersModal'
import { getMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { extractErrorMessage } from '../utils/errorUtils'
import { Navbar } from '../components/Navbar'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { GroupDetailTabs } from '../components/group/GroupDetailTabs'
import { TabMemberList } from '../components/group/TabMemberList'
import { TabPostList } from '../components/group/TabPostList'
import { TabSchedule } from '../components/group/TabSchedule'
import photoCameraIcon from '../assets/photo-camera-photograph-svgrepo-com.svg'
import userAlt1Icon from '../assets/user-alt-1-svgrepo-com.svg'
import type { GroupTab } from '../components/group/GroupDetailTabs'
import type { GroupDetailResponse, GroupMemberResponse } from '../types/group'
import type { UserDetailResponse } from '../types/user'
import { GROUP_CATEGORY_LABELS, GROUP_MEETING_TYPE_LABELS } from '../types/group'
import { removeKoreaPrefix } from '../utils/stringUtils'
import { uploadGroupImage } from '../api/imageApi'
import styles from './GroupDetailPage.module.css'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [members, setMembers] = useState<GroupMemberResponse[]>([])
  const [membersLoaded, setMembersLoaded] = useState(false)
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<GroupTab>('schedule')
  const [imageUploading, setImageUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likeLoading, setLikeLoading] = useState(false)
  const [likersModalOpen, setLikersModalOpen] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [actionError, setActionError] = useState('')

  /** 멤버 목록을 서버에서 새로 불러온다. */
  const loadMembers = useCallback(async () => {
    if (!groupId) return
    try {
      const pagedResult = await getGroupMembers(token, Number(groupId))
      setMembers(pagedResult.content)
      setMembersLoaded(true)
    } catch {
      // 멤버 목록 조회 실패 시 조용히 처리 (isMember는 false로 유지)
    }
  }, [token, groupId])

  const handleTabChange = (tab: GroupTab) => {
    if (tab === 'settings' && groupId) {
      navigate(`/app/groups/${groupId}/settings`)
      return
    }
    // 멤버 탭 진입 시 아직 로드 안 됐으면 lazy 로드
    if (tab === 'members' && !membersLoaded) {
      void loadMembers()
    }
    setActiveTab(tab)
  }

  const loadData = useCallback(async () => {
    if (!groupId) return
    try {
      setLoading(true)
      setError('')
      const [groupData, profileData, likeStatus, joinRequestStatus] = await Promise.all([
        getGroup(token, Number(groupId)),
        getMyProfile(token),
        getGroupLikeStatus(token, Number(groupId)).catch(() => ({ liked: false })),
        getMyJoinRequestStatus(token, Number(groupId)).catch(() => ({ pending: false })),
      ])
      setGroup(groupData)
      setMyProfile(profileData)
      setLikeCount(groupData.likeCount)
      setLiked(likeStatus.liked)
      setHasPendingRequest(joinRequestStatus.pending)
    } catch (err) {
      setError(extractErrorMessage(err, '모임 정보 조회 실패'))
      handleUnauthorized(err)
    } finally {
      setLoading(false)
    }
  }, [token, groupId, handleUnauthorized])

  useEffect(() => {
    void loadData()
    void loadMembers()
  }, [loadData, loadMembers])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const isMember = members.some((m) => m.username === myProfile?.username)
  const isLeader = myProfile?.username === group?.leaderUsername
  const groupImageUrl = group?.imageUrl?.trim() ? group.imageUrl.trim() : null

  const handleJoinClick = () => {
    if (!group) return
    if (group.joinType === 'APPROVAL_REQUIRED' && group.joinQuestions && group.joinQuestions.length > 0) {
      navigate(`/app/groups/${groupId}/join`)
    } else {
      handleJoinSubmit(undefined)
    }
  }

  const handleJoinSubmit = async (answer: string | undefined) => {
    if (!groupId) return
    try {
      setActionLoading(true)
      setActionError('')
      await joinGroup(token, Number(groupId), answer)
      await Promise.all([loadData(), loadMembers()])
    } catch (err) {
      setActionError(extractErrorMessage(err, '모임 가입에 실패했습니다.'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!groupId) return
    if (!window.confirm('모임에서 탈퇴하시겠습니까?')) return
    try {
      setActionLoading(true)
      setActionError('')
      await leaveGroup(token, Number(groupId))
      await Promise.all([loadData(), loadMembers()])
    } catch (err) {
      setActionError(extractErrorMessage(err, '모임 탈퇴에 실패했습니다.'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelJoinRequest = async () => {
    if (!groupId) return
    if (!window.confirm('가입 신청을 취소하시겠습니까?')) return
    try {
      setActionLoading(true)
      setActionError('')
      await cancelMyJoinRequest(token, Number(groupId))
      setHasPendingRequest(false)
    } catch (err) {
      setActionError(extractErrorMessage(err, '신청 취소에 실패했습니다.'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleKick = async (username: string, nickname: string) => {
    if (!groupId) return
    if (!window.confirm(`${nickname}님을 강퇴하시겠습니까?`)) return
    try {
      setActionLoading(true)
      await kickGroupMember(token, Number(groupId), username)
      // 강퇴 후 멤버 목록만 부분 갱신
      await loadMembers()
    } catch (err) {
      alert(extractErrorMessage(err, '강퇴 실패'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLikeToggle = async () => {
    if (!groupId || likeLoading) return
    try {
      setLikeLoading(true)
      const res = await toggleGroupLike(token, Number(groupId))
      setLiked(res.liked)
      setLikeCount(res.likeCount)
    } catch {
      // 조용히 실패
    } finally {
      setLikeLoading(false)
    }
  }

  const handleImageAreaClick = () => {
    if (!isLeader) return
    imageInputRef.current?.click()
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !groupId) return

    // 동일 파일 재선택 허용을 위해 value 초기화
    e.target.value = ''

    try {
      setImageUploading(true)
      const updated = await uploadGroupImage(token, file, Number(groupId))
      // 업로드 성공 시 group 상태의 imageUrl만 즉시 반영 (전체 재조회 없이)
      setGroup((prev) => (prev ? { ...prev, imageUrl: updated.imageUrl } : prev))
    } catch (err) {
      alert(extractErrorMessage(err, '이미지 업로드에 실패했습니다.'))
      handleUnauthorized(err)
    } finally {
      setImageUploading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={styles.loadingWrapper}>
            <LoadingSpinner />
          </div>
        </main>
      </>
    )
  }

  if (error || !group) {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={styles.errorWrapper}>
            <p className={styles.errorText}>{error || '모임을 찾을 수 없습니다.'}</p>
            <button type="button" className={styles.backButton} onClick={() => navigate('/app/groups')}>
              목록으로 돌아가기
            </button>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />

      <GroupLikersModal
        isOpen={likersModalOpen}
        groupId={Number(groupId)}
        token={token}
        onClose={() => setLikersModalOpen(false)}
      />

      <main className={styles.main}>
        <div className={styles.topRow}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate('/app/groups')}
          >
            &larr; 모임 목록
          </button>

          {!isLeader && (
            <div className={styles.actionRow}>
              {isMember ? (
                <button
                  type="button"
                  className={styles.topTextAction}
                  onClick={handleLeave}
                  disabled={actionLoading}
                >
                  {actionLoading ? '처리 중...' : '모임 탈퇴'}
                </button>
              ) : hasPendingRequest ? (
                <button
                  type="button"
                  className={styles.topTextAction}
                  onClick={handleCancelJoinRequest}
                  disabled={actionLoading}
                >
                  {actionLoading ? '처리 중...' : '신청 취소'}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.topTextAction}
                  onClick={handleJoinClick}
                  disabled={actionLoading || group.currentMemberCount >= group.maxMemberCount}
                >
                  {actionLoading
                    ? '처리 중...'
                    : group.currentMemberCount >= group.maxMemberCount
                      ? '정원 초과'
                      : group.joinType === 'APPROVAL_REQUIRED'
                        ? '가입 신청'
                        : '모임 가입'}
                </button>
              )}
              {actionError && <p className={styles.actionErrorText}>{actionError}</p>}
            </div>
          )}
        </div>

        <div className={styles.groupHeader}>
          {/* hidden file input — 모임장 전용 */}
          {isLeader && (
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
            />
          )}

          <div
            className={`${styles.heroMedia} ${isLeader ? styles.heroMediaLeader : ''}`}
            onClick={handleImageAreaClick}
            role={isLeader ? 'button' : undefined}
            tabIndex={isLeader ? 0 : undefined}
            aria-label={isLeader ? '모임 대표 사진 변경' : undefined}
            onKeyDown={isLeader ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleImageAreaClick() } : undefined}
          >
            {imageUploading ? (
              <div className={styles.heroImagePlaceholder}>
                <p className={styles.placeholderText}>업로드 중...</p>
              </div>
            ) : groupImageUrl ? (
              <>
                <img
                  src={groupImageUrl}
                  alt={`${group.name} 대표 이미지`}
                  className={styles.heroImage}
                />
                {isLeader && (
                  <div className={styles.heroImageEditOverlay} aria-hidden="true">
                    <img src={photoCameraIcon} alt="" className={styles.overlayIcon} />
                    <span className={styles.overlayText}>사진 변경</span>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.heroImagePlaceholder} role="img" aria-label="모임 이미지 준비중">
                <img src={photoCameraIcon} alt="" className={styles.placeholderIcon} />
                <p className={styles.placeholderText}>
                  {isLeader ? '사진을 등록해주세요.' : '모임의 사진을 준비중입니다.'}
                </p>
              </div>
            )}
          </div>

          <div className={styles.groupSummary}>
            <div className={styles.badgeRow}>
              <span className={styles.categoryBadge}>
                {GROUP_CATEGORY_LABELS[group.category]}
              </span>
              <span
                className={
                  group.meetingType === 'ONLINE'
                    ? styles.meetingTypeBadgeOnline
                    : styles.meetingTypeBadgeOffline
                }
              >
                {group.meetingType === 'OFFLINE' && group.region
                  ? `오프라인 · ${removeKoreaPrefix(group.region)}`
                  : GROUP_MEETING_TYPE_LABELS[group.meetingType]}
              </span>
            </div>

            {group.status === 'PENDING' && (
              <div className={styles.pendingBadge}>승인 대기중 — 관리자 승인 후 활성화됩니다.</div>
            )}
            <h1 className={styles.groupName}>{group.name}</h1>
            <div className={styles.memberCountBox}>
              <img src={userAlt1Icon} alt="" aria-hidden="true" className={styles.memberCountIcon} />
              <span className={styles.memberCountValue}>
                {group.currentMemberCount} / {group.maxMemberCount}
              </span>
            </div>

            {group.description && (
              <p className={styles.groupDescription}>{group.description}</p>
            )}
            <div className={styles.likeArea}>
              <button
                type="button"
                className={`${styles.likeHeartButton} ${liked ? styles.likeButtonActive : ''}`}
                onClick={handleLikeToggle}
                disabled={likeLoading}
                aria-label={liked ? '좋아요 취소' : '좋아요'}
              >
                <span className={styles.likeIcon}>{liked ? '♥' : '♡'}</span>
              </button>
              <button
                type="button"
                className={`${styles.likeCountButton} ${liked ? styles.likeButtonActive : ''}`}
                onClick={() => setLikersModalOpen(true)}
                aria-label={`좋아요 ${likeCount}명 보기`}
              >
                <span className={styles.likeCount}>{likeCount}</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.contentDivider} aria-hidden="true" />

        {/* 탭 네비게이션 */}
        <div className={styles.tabSection}>
          <GroupDetailTabs activeTab={activeTab} onChange={handleTabChange} isLeader={isLeader} />

          {activeTab === 'posts' && (
            <TabPostList groupId={Number(groupId)} isMember={isMember} />
          )}
          {activeTab === 'members' && (
            <TabMemberList
              members={members}
              isLeader={isLeader}
              actionLoading={actionLoading}
              onKick={handleKick}
            />
          )}
          {activeTab === 'schedule' && (
            <TabSchedule groupId={Number(groupId)} isMember={isMember} />
          )}
        </div>
      </main>
    </>
  )
}
