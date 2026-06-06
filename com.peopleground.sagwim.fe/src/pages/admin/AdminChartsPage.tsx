import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getMonthlyContentCreations,
  getMonthlyGroupCreations,
  getMonthlySignups,
} from '../../api/adminApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import {
  MultiSeriesChartCard,
  type ChartSeries,
  type MergedChartPoint,
} from '../../components/admin/MultiSeriesChartCard'
import type { MonthlyStatsPoint } from '../../types/adminStats'
import styles from './AdminChartsPage.module.css'

const SERIES: readonly ChartSeries[] = [
  { key: 'signups', label: '회원수', unit: '명', color: '#10b981' },
  { key: 'contents', label: '게시글수', unit: '건', color: '#3b82f6' },
  { key: 'groups', label: '모임수', unit: '개', color: '#f59e0b' },
] as const

function formatMonthLabel(month: string): string {
  const parts = month.split('-')
  if (parts.length !== 2) return month
  const m = Number(parts[1])
  if (Number.isNaN(m)) return month
  return `${m}월`
}

function formatFullLabel(month: string): string {
  const parts = month.split('-')
  if (parts.length !== 2) return month
  return `${parts[0]}년 ${Number(parts[1])}월`
}

function mergeMonthlyStats(
  signups: MonthlyStatsPoint[],
  contents: MonthlyStatsPoint[],
  groups: MonthlyStatsPoint[],
): MergedChartPoint[] {
  const map = new Map<string, MergedChartPoint>()
  const ensure = (month: string): MergedChartPoint => {
    let point = map.get(month)
    if (!point) {
      point = {
        month,
        label: formatMonthLabel(month),
        fullLabel: formatFullLabel(month),
        signups: 0,
        contents: 0,
        groups: 0,
      }
      map.set(month, point)
    }
    return point
  }

  signups.forEach((p) => (ensure(p.month).signups = p.count))
  contents.forEach((p) => (ensure(p.month).contents = p.count))
  groups.forEach((p) => (ensure(p.month).groups = p.count))

  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
}

export function AdminChartsPage() {
  const { token } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [signupStats, setSignupStats] = useState<MonthlyStatsPoint[]>([])
  const [contentStats, setContentStats] = useState<MonthlyStatsPoint[]>([])
  const [groupStats, setGroupStats] = useState<MonthlyStatsPoint[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setError(null)
      const [signupRes, contentRes, groupRes] = await Promise.allSettled([
        getMonthlySignups(token, 12),
        getMonthlyContentCreations(token, 12),
        getMonthlyGroupCreations(token, 12),
      ])

      const errors: string[] = []

      if (signupRes.status === 'fulfilled') {
        setSignupStats(signupRes.value.points)
      } else {
        console.error('[admin] 가입자 통계 로드 실패:', signupRes.reason)
        handleUnauthorized(signupRes.reason)
        errors.push(describeError(signupRes.reason, '가입자 통계를 불러오지 못했습니다.'))
      }

      if (contentRes.status === 'fulfilled') {
        setContentStats(contentRes.value.points)
      } else {
        console.error('[admin] 게시글 통계 로드 실패:', contentRes.reason)
        handleUnauthorized(contentRes.reason)
        errors.push(describeError(contentRes.reason, '게시글 통계를 불러오지 못했습니다.'))
      }

      if (groupRes.status === 'fulfilled') {
        setGroupStats(groupRes.value.points)
      } else {
        console.error('[admin] 모임 통계 로드 실패:', groupRes.reason)
        handleUnauthorized(groupRes.reason)
        errors.push(describeError(groupRes.reason, '모임 통계를 불러오지 못했습니다.'))
      }

      // 세 시리즈 모두 실패했을 때만 에러 화면 표시 (부분 실패는 성공분으로 차트 렌더)
      setError(errors.length === 3 ? errors.join('\n') : null)
    } finally {
      setStatsLoading(false)
    }
  }, [token, handleUnauthorized])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const mergedData = useMemo(
    () => mergeMonthlyStats(signupStats, contentStats, groupStats),
    [signupStats, contentStats, groupStats],
  )

  return (
    <div className={styles.container}>
      <MultiSeriesChartCard
        data={mergedData}
        series={SERIES}
        loading={statsLoading}
        error={error}
        onRetry={loadStats}
      />
    </div>
  )
}
