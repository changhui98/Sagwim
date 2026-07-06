import { useEffect, useState } from 'react'
import { getGroupPosts } from '../../api/postApi'
import { useAuth } from '../../context/AuthContext'
import type { ContentResponse } from '../../types/post'
import type { GroupDetailResponse } from '../../types/group'
import type { UseGroupSchedulesResult } from '../../hooks/useGroupSchedules'
import type { GroupTab } from './GroupDetailTabs'
import { PostCard } from '../post/PostCard'
import { ScheduleEventCard } from './ScheduleEventCard'
import styles from './TabHome.module.css'

interface TabHomeProps {
  group: GroupDetailResponse
  isMember: boolean
  schedule: UseGroupSchedulesResult
  onNavigateTab: (tab: GroupTab) => void
  /** 데스크톱에서는 사이드바 달력이 상시 노출이라 일정 "더 보기" 버튼을 숨긴다 */
  isDesktop: boolean
}

const PREVIEW_POST_COUNT = 3

/** '2026-07-10T19:00:00' → '7월 10일 (금)' */
function formatUpcomingDate(startAt: string): string {
  const [year, month, day] = startAt.slice(0, 10).split('-').map(Number)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[new Date(year, month - 1, day).getDay()]
  return `${month}월 ${day}일 (${weekday})`
}

/** 홈 탭: 모임 소개 + 다가오는 일정 미리보기 + 최근 게시글 요약 */
export function TabHome({ group, isMember, schedule, onNavigateTab, isDesktop }: TabHomeProps) {
  const { token, meUsername } = useAuth()
  const { upcomingSchedules, ensureUpcomingLoaded, handleAttendanceToggle } = schedule

  const [recentPosts, setRecentPosts] = useState<ContentResponse[]>([])
  const [postsLoaded, setPostsLoaded] = useState(false)

  useEffect(() => {
    ensureUpcomingLoaded()
  }, [ensureUpcomingLoaded])

  useEffect(() => {
    let cancelled = false
    getGroupPosts(token, group.id, 0, PREVIEW_POST_COUNT)
      .then((result) => {
        if (!cancelled) setRecentPosts(result.content)
      })
      .catch(() => {
        // 실패 시 빈 목록 유지
      })
      .finally(() => {
        if (!cancelled) setPostsLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [token, group.id])

  return (
    <div className={styles.wrapper}>
      {group.description && (
        <section className={styles.section} aria-label="모임 소개">
          <h2 className={styles.sectionTitle}>모임 소개</h2>
          <p className={styles.description}>{group.description}</p>
        </section>
      )}

      <section className={styles.section} aria-label="다가오는 일정">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>다가오는 일정</h2>
          {!isDesktop && (
            <button type="button" className={styles.moreBtn} onClick={() => onNavigateTab('schedule')}>
              더 보기
            </button>
          )}
        </div>
        {upcomingSchedules.length === 0 ? (
          <p className={styles.emptyText}>예정된 일정이 없습니다.</p>
        ) : (
          <ul className={styles.scheduleList}>
            {upcomingSchedules.map((s) => (
              <li key={s.id}>
                <span className={styles.upcomingDate}>{formatUpcomingDate(s.startAt)}</span>
                <ScheduleEventCard
                  schedule={s}
                  myUsername={isMember ? meUsername : null}
                  onAttendanceToggle={isMember ? handleAttendanceToggle : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-label="최근 게시글">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>최근 게시글</h2>
          <button type="button" className={styles.moreBtn} onClick={() => onNavigateTab('posts')}>
            더 보기
          </button>
        </div>
        {!postsLoaded ? (
          <p className={styles.emptyText}>불러오는 중...</p>
        ) : recentPosts.length === 0 ? (
          <p className={styles.emptyText}>아직 게시글이 없습니다.</p>
        ) : (
          <ul className={styles.postList}>
            {recentPosts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} fullWidth />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
