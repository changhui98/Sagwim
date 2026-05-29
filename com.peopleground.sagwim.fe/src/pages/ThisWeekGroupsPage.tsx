import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getThisWeekGroups, toggleGroupLike } from '../api/groupApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { EmptyState } from '../components/common/EmptyState'
import { extractLastRegionToken } from '../utils/stringUtils'
import type { GroupResponse } from '../types/group'
import { GROUP_CATEGORY_LABELS, GROUP_MEETING_TYPE_LABELS } from '../types/group'
import userAlt1Icon from '../assets/user-alt-1-svgrepo-com.svg'
import thisweekIcon from '../assets/sagwim-section-thisweek.svg'
import styles from './PopularGroupsPage.module.css'

export function ThisWeekGroupsPage() {
  const navigate = useNavigate()
  const { token, meRole } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()
  const handleLogout = useLogout()

  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({})
  const [likeCountMap, setLikeCountMap] = useState<Record<number, number>>({})

  const load = useCallback(
    async () => {
      try {
        setLoading(true)
        setError('')

        const incoming = await getThisWeekGroups(token)
        setGroups(incoming)

        setLikeCountMap(() => {
          const next: Record<number, number> = {}
          incoming.forEach((g) => { next[g.id] = g.likeCount ?? 0 })
          return next
        })
        setLikedMap(() => {
          const next: Record<number, boolean> = {}
          incoming.forEach((g) => { next[g.id] = g.isLiked })
          return next
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : '모임 목록 조회 실패'
        setError(message)
        handleUnauthorized(err)
      } finally {
        setLoading(false)
      }
    },
    [token, handleUnauthorized],
  )

  useEffect(() => {
    load()
  }, [load])

  const handleLikeToggle = async (e: React.MouseEvent, groupId: number) => {
    e.stopPropagation()
    try {
      const res = await toggleGroupLike(token, groupId)
      setLikedMap((prev) => ({ ...prev, [groupId]: res.liked }))
      setLikeCountMap((prev) => ({ ...prev, [groupId]: res.likeCount }))
    } catch {
      // 조용히 실패
    }
  }

  const renderGroupCard = (group: GroupResponse) => {
    const regionTag = extractLastRegionToken(group.region)
    return (
    <div
      key={group.id}
      role="button"
      tabIndex={0}
      className={styles.groupCard}
      onClick={() => navigate(`/app/groups/${group.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/app/groups/${group.id}`) }}
    >
      <div className={styles.groupImageWrap}>
        {group.imageUrl ? (
          <img
            src={group.imageUrl}
            alt={group.name}
            className={styles.groupImage}
          />
        ) : (
          <div className={styles.groupImagePlaceholder}>🏠</div>
        )}
        <div className={styles.imageBadges}>
          <span className={styles.imageBadge}>
            {GROUP_CATEGORY_LABELS[group.category]}
          </span>
          <span className={`${styles.imageBadge} ${group.meetingType === 'ONLINE' ? styles.imageBadgeOnline : styles.imageBadgeOffline}`}>
            {GROUP_MEETING_TYPE_LABELS[group.meetingType]}
          </span>
        </div>
      </div>
      <div className={styles.groupInfo}>
        <div className={styles.groupNameRow}>
          <p className={styles.groupName}>{regionTag ? `[${regionTag}] ` : ''}{group.name}</p>
          <div className={styles.memberCount}>
            <img src={userAlt1Icon} alt="" aria-hidden="true" className={styles.memberCountIcon} />
            <span>{group.currentMemberCount}/{group.maxMemberCount}</span>
          </div>
        </div>
        <div className={styles.groupDescRow}>
          <p className={styles.groupDesc}>{group.description ?? ''}</p>
          <button
            type="button"
            className={`${styles.likeButton} ${likedMap[group.id] ? styles.likeButtonActive : ''}`}
            onClick={(e) => handleLikeToggle(e, group.id)}
            aria-label={likedMap[group.id] ? '좋아요 취소' : '좋아요'}
          >
            <span>{likedMap[group.id] ? '♥' : '♡'}</span>
            <span>{likeCountMap[group.id] ?? 0}</span>
          </button>
        </div>
      </div>
    </div>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingWrapper}>
          <LoadingSpinner />
        </div>
      )
    }

    if (error) {
      return (
        <div className="card">
          <EmptyState
            title="모임 목록을 불러올 수 없습니다."
            description={error}
            action={{ label: '다시 시도', onClick: () => load() }}
          />
        </div>
      )
    }

    if (groups.length === 0) {
      return (
        <div className={styles.emptyStateCenter}>
          <EmptyState
            title="이번 주 모임이 없습니다."
            description="이번 주 일정이 있는 모임이 여기에 표시됩니다."
          />
        </div>
      )
    }

    return (
      <div className={styles.groupGrid}>
        {groups.map((group) => renderGroupCard(group))}
      </div>
    )
  }

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate('/app')}
            aria-label="뒤로 가기"
          >
            ←
          </button>
          <div>
            <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src={thisweekIcon} alt="" width={22} height={22} />
              이번 주에 만나요
            </h1>
            <p className={styles.pageSubtitle}>이번 주 일정이 있는 모임 전체 목록</p>
          </div>
        </div>

        {renderContent()}
      </main>
    </>
  )
}
