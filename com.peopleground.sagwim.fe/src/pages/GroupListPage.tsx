import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getDeadlineGroups,
  getGroups,
  getNewGroups,
  getPopularGroups,
  getThisWeekGroups,
  toggleGroupLike,
} from '../api/groupApi'
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
import { buildRecommendSlides } from '../components/home/recommendSlides'
import { CreateGroupCta } from '../components/home/CreateGroupCta'
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

  // 마감 임박 모임 상태 (실패 시 조용히 숨김)
  const [deadlineGroups, setDeadlineGroups] = useState<GroupResponse[]>([])
  const [deadlineLoading, setDeadlineLoading] = useState(true)

  // 이번 주 일정 모임 상태 (실패 시 조용히 숨김)
  const [thisWeekGroups, setThisWeekGroups] = useState<GroupResponse[]>([])
  const [thisWeekLoading, setThisWeekLoading] = useState(true)

  // 프로필 상태
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // 좋아요 상태 (전 섹션 통합 관리)
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

  // 목록 응답의 좋아요 상태를 통합 맵에 병합
  const ingestLikes = useCallback((incoming: GroupResponse[]) => {
    const countMap: Record<number, number> = {}
    const likedMapUpdate: Record<number, boolean> = {}
    incoming.forEach((g) => {
      countMap[g.id] = g.likeCount ?? 0
      likedMapUpdate[g.id] = g.isLiked
    })
    setLikeCountMap((prev) => ({ ...prev, ...countMap }))
    setLikedMap((prev) => ({ ...prev, ...likedMapUpdate }))
  }, [])

  const loadGroups = useCallback(
    async () => {
      setLoading(true)
      setPopularLoading(true)
      setNeighborhoodLoading(true)
      setDeadlineLoading(true)
      setThisWeekLoading(true)
      setError('')
      setPopularError('')
      setNeighborhoodError('')

      // 5개 섹션 데이터를 병렬 조회 (배너는 이 결과를 재활용하므로 추가 호출 없음)
      const [newResult, popularResult, neighborhoodResult, deadlineResult, thisWeekResult] =
        await Promise.allSettled([
          getNewGroups(token).then((res) => res.content),
          getPopularGroups(token, 0, PREVIEW_COUNT).then((res) => res.content),
          getGroups(token, 0, PREVIEW_COUNT).then((res) => res.content),
          getDeadlineGroups(token, 0, PREVIEW_COUNT).then((res) => res.content),
          getThisWeekGroups(token),
        ])

      const applyResult = (
        result: PromiseSettledResult<GroupResponse[]>,
        setData: (list: GroupResponse[]) => void,
        setErrorMessage: ((message: string) => void) | null,
        fallbackMessage: string,
      ) => {
        if (result.status === 'fulfilled') {
          setData(result.value)
          ingestLikes(result.value)
        } else if (setErrorMessage) {
          setErrorMessage(
            result.reason instanceof Error ? result.reason.message : fallbackMessage,
          )
        }
      }

      applyResult(newResult, setGroups, setError, '모임 목록 조회 실패')
      setLoading(false)

      applyResult(popularResult, setPopularGroups, setPopularError, '인기 모임 목록 조회 실패')
      setPopularLoading(false)

      applyResult(neighborhoodResult, setNeighborhoodGroups, setNeighborhoodError, '동네 모임 목록 조회 실패')
      setNeighborhoodLoading(false)

      applyResult(deadlineResult, setDeadlineGroups, null, '')
      setDeadlineLoading(false)

      applyResult(thisWeekResult, setThisWeekGroups, null, '')
      setThisWeekLoading(false)

      // 인증 만료는 어떤 호출이 실패했든 동일하므로 첫 실패에 대해 1회만 처리
      const firstRejected = [newResult, popularResult, neighborhoodResult, deadlineResult, thisWeekResult]
        .find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (firstRejected) handleUnauthorized(firstRejected.reason)
    },
    [token, handleUnauthorized, ingestLikes],
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
        setFilteredGroups(res.content)
        ingestLikes(res.content)
      } catch (err) {
        setFilteredError(err instanceof Error ? err.message : '모임 목록 조회 실패')
        handleUnauthorized(err)
      } finally {
        setFilteredLoading(false)
      }
    },
    [token, handleUnauthorized, ingestLikes],
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
        setSearchResults(res.content)
        ingestLikes(res.content)
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : '모임 검색 실패')
        handleUnauthorized(err)
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, token, handleUnauthorized, ingestLikes])

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

  // 배너 슬라이드: 인기 → 마감임박 → 신규 → 동네 전체 폴백, 전부 비면 정적 서비스 배너
  const bannerSlides = useMemo(
    () => buildRecommendSlides(popularGroups, deadlineGroups, groups, neighborhoodGroups),
    [popularGroups, deadlineGroups, groups, neighborhoodGroups],
  )
  const bannerLoading = loading || popularLoading || neighborhoodLoading || deadlineLoading

  const renderSections = () => (
    <div className={styles.sectionsWrap}>
      <GroupSection
        title="곧 마감돼요"
        subtitle="지금 아니면 자리가 없을지도 몰라요"
        groups={deadlineGroups.slice(0, PREVIEW_COUNT)}
        loading={deadlineLoading}
        error=""
        onRetry={loadGroups}
        onViewAll={() => navigate('/app/groups/deadline')}
        likedMap={likedMap}
        likeCountMap={likeCountMap}
        onLikeToggle={handleLikeToggle}
        hideWhenEmpty
      />
      <GroupSection
        title="이번 주에 만나요"
        subtitle="이번 주 일정이 잡힌 모임이에요"
        groups={thisWeekGroups.slice(0, PREVIEW_COUNT)}
        loading={thisWeekLoading}
        error=""
        onRetry={loadGroups}
        onViewAll={() => navigate('/app/groups/thisweek')}
        likedMap={likedMap}
        likeCountMap={likeCountMap}
        onLikeToggle={handleLikeToggle}
        hideWhenEmpty
      />
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
        hideWhenEmpty
      />
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
        hideWhenEmpty
      />
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
        emptyDescription="첫 모임을 만들어 이웃을 초대해보세요."
        emptyAction={{ label: '모임 만들기', onClick: () => navigate('/app/create') }}
      />
    </div>
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
            slides={bannerSlides}
            loading={bannerLoading}
            onNavigate={navigate}
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
          <CreateGroupCta />
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
                <span style={{ color: '#7B92BC' }}>사귐</span>은 동네에서 시작돼요
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
