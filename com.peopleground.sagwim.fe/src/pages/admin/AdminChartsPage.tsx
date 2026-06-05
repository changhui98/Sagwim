import { useCallback, useEffect, useState } from 'react'
import {
  getMonthlyContentCreations,
  getMonthlyGroupCreations,
  getMonthlySignups,
} from '../../api/adminApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { MonthlyChartCard } from '../../components/admin/MonthlyChartCard'
import type { MonthlyStatsPoint } from '../../types/adminStats'
import styles from './AdminChartsPage.module.css'

export function AdminChartsPage() {
  const { token } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [signupStats, setSignupStats] = useState<MonthlyStatsPoint[]>([])
  const [contentStats, setContentStats] = useState<MonthlyStatsPoint[]>([])
  const [groupStats, setGroupStats] = useState<MonthlyStatsPoint[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [signupError, setSignupError] = useState<string | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)
  const [groupError, setGroupError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    const describeError = (reason: unknown, fallback: string): string => {
      if (reason instanceof ApiError) {
        if (reason.status >= 500) {
          return `${fallback} 잠시 후 다시 시도해 주세요. (HTTP ${reason.status})`
        }
        return `${fallback} (HTTP ${reason.status})`
      }
      return fallback
    }

    try {
      setStatsLoading(true)
      setSignupError(null)
      setContentError(null)
      setGroupError(null)
      const [signupRes, contentRes, groupRes] = await Promise.allSettled([
        getMonthlySignups(token, 12),
        getMonthlyContentCreations(token, 12),
        getMonthlyGroupCreations(token, 12),
      ])

      if (signupRes.status === 'fulfilled') {
        setSignupStats(signupRes.value.points)
      } else {
        console.error('[admin] 가입자 통계 로드 실패:', signupRes.reason)
        handleUnauthorized(signupRes.reason)
        setSignupError(
          describeError(signupRes.reason, '가입자 통계를 불러오지 못했습니다.'),
        )
      }

      if (contentRes.status === 'fulfilled') {
        setContentStats(contentRes.value.points)
      } else {
        console.error('[admin] 게시글 통계 로드 실패:', contentRes.reason)
        handleUnauthorized(contentRes.reason)
        setContentError(
          describeError(contentRes.reason, '게시글 통계를 불러오지 못했습니다.'),
        )
      }

      if (groupRes.status === 'fulfilled') {
        setGroupStats(groupRes.value.points)
      } else {
        console.error('[admin] 모임 통계 로드 실패:', groupRes.reason)
        handleUnauthorized(groupRes.reason)
        setGroupError(
          describeError(groupRes.reason, '모임 통계를 불러오지 못했습니다.'),
        )
      }
    } finally {
      setStatsLoading(false)
    }
  }, [token, handleUnauthorized])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return (
    <div className={styles.container}>
      <div className={styles.chartsGrid}>
        <MonthlyChartCard
          title="월별 신규 가입자 수"
          subtitle="최근 12개월 · KST 기준"
          unit="명"
          color="#10b981"
          data={signupStats}
          loading={statsLoading}
          error={signupError}
          onRetry={loadStats}
        />
        <MonthlyChartCard
          title="월별 신규 게시글 수"
          subtitle="최근 12개월 · KST 기준"
          unit="건"
          color="#10b981"
          data={contentStats}
          loading={statsLoading}
          error={contentError}
          onRetry={loadStats}
        />
        <MonthlyChartCard
          title="월별 모임 생성 수"
          subtitle="최근 3개월 · KST 기준"
          unit="개"
          color="#10b981"
          data={groupStats}
          loading={statsLoading}
          error={groupError}
          onRetry={loadStats}
        />
      </div>
    </div>
  )
}
