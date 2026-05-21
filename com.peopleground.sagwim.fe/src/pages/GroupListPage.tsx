import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGroups, getNewGroups, getPopularGroups, toggleGroupLike } from '../api/groupApi'
import { getMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import type { GroupResponse } from '../types/group'
import type { UserDetailResponse } from '../types/user'
import mapPinAltIcon from '../assets/map-pin-alt-svgrepo-com.svg'
import arrowNarrowRightIcon from '../assets/arrow-narrow-right-svgrepo-com.svg'
import sproutIcon from '../assets/sagwim-section-sprout.svg'
import flameIcon from '../assets/sagwim-section-flame.svg'
import deadlineIcon from '../assets/sagwim-section-deadline.svg'
import thisweekIcon from '../assets/sagwim-section-thisweek.svg'
import pinIcon from '../assets/sagwim-section-pin.svg'
import { GroupSection } from '../components/group/GroupSection'
import { MobileHeader } from '../components/MobileHeader'
import { extractLastRegionToken } from '../utils/stringUtils'
import styles from './GroupListPage.module.css'

// 메인 화면에서 노출할 최대 개수
const PREVIEW_COUNT = 5

export function GroupListPage() {
  const navigate = useNavigate()
  const { token, meRole } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()
  const handleLogout = useLogout()

  // 신규 모임 상태
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 인기 모임 상태
  const [popularGroups, setPopularGroups] = useState<GroupResponse[]>([])
  const [popularLoading, setPopularLoading] = useState(true)
  const [popularError, setPopularError] = useState('')

  // 동네 모든 모임 상태
  const [neighborhoodGroups, setNeighborhoodGroups] = useState<GroupResponse[]>([])
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(true)
  const [neighborhoodError, setNeighborhoodError] = useState('')

  // 프로필 상태
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // 좋아요 상태 (신규 + 인기 모임 통합 관리)
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({})
  const [likeCountMap, setLikeCountMap] = useState<Record<number, number>>({})

  const loadGroups = useCallback(
    async () => {
      setLoading(true)
      setPopularLoading(true)
      setNeighborhoodLoading(true)
      setError('')
      setPopularError('')
      setNeighborhoodError('')

      // 신규 모임·인기 모임·동네 모든 모임을 병렬로 조회
      const [newResult, popularResult, neighborhoodResult] = await Promise.allSettled([
        getNewGroups(token),
        getPopularGroups(token, 0, PREVIEW_COUNT),
        getGroups(token, 0, PREVIEW_COUNT),
      ])

      // 신규 모임 처리
      if (newResult.status === 'fulfilled') {
        const incoming = newResult.value.content
        setGroups(incoming)
        const countMap: Record<number, number> = {}
        const likedMapUpdate: Record<number, boolean> = {}
        incoming.forEach((g) => {
          countMap[g.id] = g.likeCount ?? 0
          likedMapUpdate[g.id] = g.isLiked
        })
        setLikeCountMap((prev) => ({ ...prev, ...countMap }))
        setLikedMap((prev) => ({ ...prev, ...likedMapUpdate }))
      } else {
        const message = newResult.reason instanceof Error ? newResult.reason.message : '모임 목록 조회 실패'
        setError(message)
        handleUnauthorized(newResult.reason)
      }
      setLoading(false)

      // 인기 모임 처리
      if (popularResult.status === 'fulfilled') {
        const incoming = popularResult.value.content
        setPopularGroups(incoming)
        const countMap: Record<number, number> = {}
        const likedMapUpdate: Record<number, boolean> = {}
        incoming.forEach((g) => {
          countMap[g.id] = g.likeCount ?? 0
          likedMapUpdate[g.id] = g.isLiked
        })
        setLikeCountMap((prev) => ({ ...prev, ...countMap }))
        setLikedMap((prev) => ({ ...prev, ...likedMapUpdate }))
      } else {
        const message = popularResult.reason instanceof Error ? popularResult.reason.message : '인기 모임 목록 조회 실패'
        setPopularError(message)
      }
      setPopularLoading(false)

      // 동네 모든 모임 처리
      if (neighborhoodResult.status === 'fulfilled') {
        const incoming = neighborhoodResult.value.content
        setNeighborhoodGroups(incoming)
        const countMap: Record<number, number> = {}
        const likedMapUpdate: Record<number, boolean> = {}
        incoming.forEach((g) => {
          countMap[g.id] = g.likeCount ?? 0
          likedMapUpdate[g.id] = g.isLiked
        })
        setLikeCountMap((prev) => ({ ...prev, ...countMap }))
        setLikedMap((prev) => ({ ...prev, ...likedMapUpdate }))
      } else {
        const message = neighborhoodResult.reason instanceof Error ? neighborhoodResult.reason.message : '동네 모임 목록 조회 실패'
        setNeighborhoodError(message)
      }
      setNeighborhoodLoading(false)
    },
    [token, handleUnauthorized],
  )

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    getMyProfile(token)
      .then(setMyProfile)
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [token])

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

  const renderContent = () => (
    <>
      <GroupSection
        title={<><img src={pinIcon} alt="" width={22} height={22} />{extractLastRegionToken(myProfile?.address) ?? '우리 동네'} 모든 모임</>}
        subtitle="우리 동네 모임, 여기 다 있어요"
        groups={neighborhoodGroups}
        loading={neighborhoodLoading}
        error={neighborhoodError}
        onRetry={loadGroups}
        onViewAll={() => navigate('/app/groups')}
        likedMap={likedMap}
        likeCountMap={likeCountMap}
        onLikeToggle={handleLikeToggle}
        emptyTitle="노출 범위 내 모임이 아직 없어요."
        emptyDescription="주변 모임이 생기면 여기에 표시됩니다."
      />
      <hr className={styles.divider} />
      <GroupSection
        title={<><img src={sproutIcon} alt="" width={22} height={22} />갓 피어난 모임</>}
        subtitle="당신이 첫 멤버가 될 수도 있어요"
        groups={groups.slice(0, PREVIEW_COUNT)}
        loading={loading}
        error={error}
        onRetry={loadGroups}
        onViewAll={() => navigate('/app/groups/recent')}
        likedMap={likedMap}
        likeCountMap={likeCountMap}
        onLikeToggle={handleLikeToggle}
        emptyTitle="최근 7일 내 생성된 모임이 없습니다."
        emptyDescription="첫 번째 모임을 만들어보세요."
      />
      <hr className={styles.divider} />
      <GroupSection
        title={<><img src={flameIcon} alt="" width={22} height={22} />요즘 북적이는 모임</>}
        subtitle="모두가 모이는 데는 이유가 있죠"
        groups={popularGroups}
        loading={popularLoading}
        error={popularError}
        onRetry={loadGroups}
        onViewAll={() => navigate('/app/groups/popular')}
        likedMap={likedMap}
        likeCountMap={likeCountMap}
        onLikeToggle={handleLikeToggle}
        emptyTitle="아직 인기 모임이 없습니다."
        emptyDescription="좋아요를 많이 받은 모임이 여기에 표시됩니다."
      />
      <hr className={styles.divider} />
      <GroupSection
        title={<><img src={deadlineIcon} alt="" width={22} height={22} />마감 임박 모임</>}
        subtitle="곧 자리가 사라져요"
        groups={[]}
        loading={false}
        error=""
        onViewAll={() => navigate('/app/groups/deadline')}
        likedMap={likedMap}
        likeCountMap={likeCountMap}
        onLikeToggle={handleLikeToggle}
        emptyTitle="마감 임박 모임이 없습니다."
        emptyDescription="곧 자리가 사라질 모임이 여기에 표시됩니다."
      />
      <hr className={styles.divider} />
      <GroupSection
        title={<><img src={thisweekIcon} alt="" width={22} height={22} />이번 주에 만나요</>}
        subtitle="가까운 약속이 기다리고 있어요"
        groups={[]}
        loading={false}
        error=""
        onViewAll={() => navigate('/app/groups/thisweek')}
        likedMap={likedMap}
        likeCountMap={likeCountMap}
        onLikeToggle={handleLikeToggle}
        emptyTitle="이번 주 모임이 없습니다."
        emptyDescription="이번 주 일정이 있는 모임이 여기에 표시됩니다."
      />
    </>
  )

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <MobileHeader onLogout={handleLogout} />

      <main className={styles.main}>
        {!profileLoading && myProfile?.address
          ? renderContent()
          : !profileLoading && (
            <div className={styles.noAddress}>
              <p className={`${styles.noAddressText} ${styles.animItem} ${styles.animDelay1}`}>
                <span style={{ color: '#E06060' }}>사귐</span>은 동네에서 시작돼요
              </p>
              <p className={`${styles.noAddressSubText} ${styles.animItem} ${styles.animDelay2}`}>
                먼저 우리 동네를 알려주세요.
              </p>
              <div className={`${styles.animItem} ${styles.animDelay3}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <img src={mapPinAltIcon} alt="" width={48} height={48} className={styles.noAddressIcon} />
                <p className={styles.noAddressHint}>내 동네를 등록하면 가까운 모임이 열려요</p>
              </div>
              <button
                type="button"
                className={`${styles.noAddressButton} ${styles.animItem} ${styles.animDelay4}`}
                onClick={() => navigate('/app/profile/edit/address')}
              >
                등록하기
                <img src={arrowNarrowRightIcon} alt="" width={16} height={16} className={styles.noAddressButtonIcon} />
              </button>
            </div>
          )}
      </main>
    </>
  )
}
