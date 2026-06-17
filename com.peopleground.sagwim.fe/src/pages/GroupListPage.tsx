import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGroups, getNewGroups, getPopularGroups, toggleGroupLike } from '../api/groupApi'
import { getMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import type { GroupResponse } from '../types/group'
import type { UserDetailResponse } from '../types/user'
import mapPinAltIcon from '../assets/map-pin-alt-svgrepo-com.svg'
import arrowNarrowRightIcon from '../assets/arrow-narrow-right-svgrepo-com.svg'
import { GroupSection } from '../components/group/GroupSection'
import { MobileHeader } from '../components/MobileHeader'
import { HomeTopBar } from '../components/home/HomeTopBar'
import { CategoryChips } from '../components/home/CategoryChips'
import { chipLabel, type CategoryChipKey } from '../components/home/categoryFilter'
import { RecommendCarousel } from '../components/home/RecommendCarousel'
import { extractLastRegionToken } from '../utils/stringUtils'
import styles from './GroupListPage.module.css'

// 메인 화면에서 노출할 최대 개수
const PREVIEW_COUNT = 5

// 카테고리 필터 시 조회할 개수
const FILTER_FETCH_SIZE = 20

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

  // 카테고리 칩 필터 상태
  const [activeCategory, setActiveCategory] = useState<CategoryChipKey>('ALL')
  const [filteredGroups, setFilteredGroups] = useState<GroupResponse[]>([])
  const [filteredLoading, setFilteredLoading] = useState(false)
  const [filteredError, setFilteredError] = useState('')

  // 모임명 인라인 검색 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GroupResponse[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

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

  // 카테고리 칩 선택 시 해당 조건으로 모임 재조회 (전체는 기존 섹션 표시)
  const loadFiltered = useCallback(
    async (key: CategoryChipKey) => {
      if (key === 'ALL') return
      setFilteredLoading(true)
      setFilteredError('')
      try {
        const res =
          key === 'ONLINE'
            ? await getGroups(token, 0, FILTER_FETCH_SIZE, undefined, undefined, 'ONLINE')
            : await getGroups(token, 0, FILTER_FETCH_SIZE, undefined, key)
        const incoming = res.content
        setFilteredGroups(incoming)
        const countMap: Record<number, number> = {}
        const likedMapUpdate: Record<number, boolean> = {}
        incoming.forEach((g) => {
          countMap[g.id] = g.likeCount ?? 0
          likedMapUpdate[g.id] = g.isLiked
        })
        setLikeCountMap((prev) => ({ ...prev, ...countMap }))
        setLikedMap((prev) => ({ ...prev, ...likedMapUpdate }))
      } catch (err) {
        setFilteredError(err instanceof Error ? err.message : '모임 목록 조회 실패')
        handleUnauthorized(err)
      } finally {
        setFilteredLoading(false)
      }
    },
    [token, handleUnauthorized],
  )

  const handleCategoryChange = (key: CategoryChipKey) => {
    setActiveCategory(key)
    if (key !== 'ALL') loadFiltered(key)
  }

  // 모임명 검색 — 300ms 디바운스 후 keyword 조회 (페이지 전환 없이 인라인 렌더)
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setSearchResults([])
      setSearchError('')
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      setSearchError('')
      try {
        const res = await getGroups(token, 0, 20, trimmed)
        const incoming = res.content
        setSearchResults(incoming)
        const countMap: Record<number, number> = {}
        const likedMapUpdate: Record<number, boolean> = {}
        incoming.forEach((g) => {
          countMap[g.id] = g.likeCount ?? 0
          likedMapUpdate[g.id] = g.isLiked
        })
        setLikeCountMap((prev) => ({ ...prev, ...countMap }))
        setLikedMap((prev) => ({ ...prev, ...likedMapUpdate }))
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : '모임 검색 실패')
        handleUnauthorized(err)
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, token, handleUnauthorized])

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

  const renderSections = () => (
    <>
      <GroupSection
        title={`${extractLastRegionToken(myProfile?.address) ?? '우리 동네'} 모든 모임`}
        subtitle="우리 동네 모임, 여기 다 있어요"
        groups={neighborhoodGroups}
        loading={neighborhoodLoading}
        error={neighborhoodError}
        onRetry={loadGroups}
        onViewAll={() => navigate('/app/groups/all')}
        likedMap={likedMap}
        likeCountMap={likeCountMap}
        onLikeToggle={handleLikeToggle}
        emptyTitle="노출 범위 내 모임이 아직 없어요."
        emptyDescription="주변 모임이 생기면 여기에 표시됩니다."
      />
      <hr className={styles.divider} />
      <GroupSection
        title="갓 피어난 모임"
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
        title="요즘 북적이는 모임"
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
    </>
  )

  const isSearching = searchQuery.trim().length > 0

  const renderContent = () => (
    <>
      <HomeTopBar
        regionLabel={extractLastRegionToken(myProfile?.address)}
        onLocationClick={() => navigate('/app/profile/edit/address')}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
      {isSearching ? (
        <GroupSection
          title={`'${searchQuery.trim()}' 검색 결과`}
          subtitle="모임명으로 찾은 결과예요"
          groups={searchResults}
          loading={searchLoading}
          error={searchError}
          likedMap={likedMap}
          likeCountMap={likeCountMap}
          onLikeToggle={handleLikeToggle}
          emptyTitle="검색 결과가 없어요."
          emptyDescription="다른 검색어로 시도해 보세요."
        />
      ) : (
        <>
          <CategoryChips active={activeCategory} onChange={handleCategoryChange} />
          <RecommendCarousel
            groups={popularGroups.slice(0, 3)}
            onNavigate={(groupId) => navigate(`/app/groups/${groupId}`)}
          />
          {activeCategory === 'ALL' ? (
            renderSections()
          ) : (
            <GroupSection
              title={`${chipLabel(activeCategory)} 모임`}
              subtitle="선택한 카테고리의 우리 동네 모임이에요"
              groups={filteredGroups}
              loading={filteredLoading}
              error={filteredError}
              onRetry={() => loadFiltered(activeCategory)}
              likedMap={likedMap}
              likeCountMap={likeCountMap}
              onLikeToggle={handleLikeToggle}
              emptyTitle="해당 카테고리 모임이 없어요."
              emptyDescription="다른 카테고리를 선택해 보세요."
            />
          )}
        </>
      )}
    </>
  )

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <Header role={meRole} onLogout={handleLogout} />
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
      <Footer />
    </>
  )
}
