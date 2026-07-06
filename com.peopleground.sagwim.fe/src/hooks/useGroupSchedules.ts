import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getGroupSchedules, toggleScheduleAttendance } from '../api/groupApi'
import { useAuth } from '../context/AuthContext'
import type { ScheduleResponse } from '../types/group'

function toDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/** month는 0-indexed */
function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

export interface UseGroupSchedulesResult {
  displayedYear: number
  displayedMonth: number
  selectedDate: string | null
  /** 달력에 표시 중인 월의 일정 */
  schedules: ScheduleResponse[]
  /** 오늘 이후(오늘 포함) 일정 상위 3건 — 이번 달 + 다음 달 범위 */
  upcomingSchedules: ScheduleResponse[]
  loading: boolean
  isCreateModalOpen: boolean
  openCreateModal: () => void
  closeCreateModal: () => void
  handleMonthChange: (year: number, month: number) => void
  handleDateSelect: (date: string) => void
  handleAttendanceToggle: (scheduleId: number) => Promise<void>
  handleScheduleCreated: () => void
  ensureUpcomingLoaded: () => void
}

/**
 * 모임 일정 상태를 월 단위 캐시로 관리한다.
 * 달력(표시 월)과 홈 탭 미리보기(이번 달+다음 달)가 같은 캐시를 공유해
 * 사이드바↔일정 탭 전환이나 리사이즈에도 선택 날짜·조회 월이 유지된다.
 */
export function useGroupSchedules(groupId: number): UseGroupSchedulesResult {
  const { token } = useAuth()

  const today = new Date()
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate())
  const [displayedYear, setDisplayedYear] = useState(today.getFullYear())
  const [displayedMonth, setDisplayedMonth] = useState(today.getMonth()) // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr)
  const [schedulesByMonth, setSchedulesByMonth] = useState<Record<string, ScheduleResponse[]>>({})
  const [loading, setLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const upcomingRequestedRef = useRef(false)

  const fetchMonth = useCallback(
    async (year: number, month: number) => {
      try {
        const data = await getGroupSchedules(token, groupId, year, month + 1)
        setSchedulesByMonth((prev) => ({ ...prev, [monthKey(year, month)]: data }))
      } catch {
        // 백엔드 미연동 또는 오류 시 빈 배열로 fallback
        setSchedulesByMonth((prev) => ({ ...prev, [monthKey(year, month)]: [] }))
      }
    },
    [token, groupId],
  )

  const fetchDisplayedMonth = useCallback(
    async (year: number, month: number) => {
      setLoading(true)
      try {
        await fetchMonth(year, month)
      } finally {
        setLoading(false)
      }
    },
    [fetchMonth],
  )

  // 표시 월은 진입/월 이동 시마다 재조회해 최신 상태를 유지한다 (기존 TabSchedule 동작)
  useEffect(() => {
    void fetchDisplayedMonth(displayedYear, displayedMonth)
  }, [fetchDisplayedMonth, displayedYear, displayedMonth])

  /** 홈 탭 미리보기용 — 실제 오늘 기준 이번 달·다음 달 캐시를 보장한다. */
  const ensureUpcomingLoaded = useCallback(() => {
    if (upcomingRequestedRef.current) return
    upcomingRequestedRef.current = true
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    void fetchMonth(now.getFullYear(), now.getMonth())
    void fetchMonth(next.getFullYear(), next.getMonth())
  }, [fetchMonth])

  const handleMonthChange = (year: number, month: number) => {
    setDisplayedYear(year)
    setDisplayedMonth(month)
    setSelectedDate(null)
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
  }

  const handleAttendanceToggle = useCallback(
    async (scheduleId: number) => {
      const result = await toggleScheduleAttendance(token, groupId, scheduleId)
      // 서버 응답값으로 모든 월 캐시에서 해당 일정만 부분 갱신한다
      setSchedulesByMonth((prev) => {
        const updated: Record<string, ScheduleResponse[]> = {}
        for (const [key, list] of Object.entries(prev)) {
          updated[key] = list.map((s) =>
            s.id === scheduleId
              ? { ...s, attendingByMe: result.attending, attendeeCount: result.attendeeCount }
              : s,
          )
        }
        return updated
      })
    },
    [token, groupId],
  )

  const handleScheduleCreated = useCallback(() => {
    // 표시 월 + (로드됐다면) 홈 미리보기용 이번 달·다음 달을 재조회한다
    const keys = new Set<string>()
    const refetch = (year: number, month: number) => {
      const key = monthKey(year, month)
      if (keys.has(key)) return
      keys.add(key)
      void fetchMonth(year, month)
    }
    refetch(displayedYear, displayedMonth)
    if (upcomingRequestedRef.current) {
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      refetch(now.getFullYear(), now.getMonth())
      refetch(next.getFullYear(), next.getMonth())
    }
  }, [fetchMonth, displayedYear, displayedMonth])

  const schedules = schedulesByMonth[monthKey(displayedYear, displayedMonth)] ?? []

  const upcomingSchedules = useMemo(() => {
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const pool = [
      ...(schedulesByMonth[monthKey(now.getFullYear(), now.getMonth())] ?? []),
      ...(schedulesByMonth[monthKey(next.getFullYear(), next.getMonth())] ?? []),
    ]
    const nowStr = toDateString(now.getFullYear(), now.getMonth(), now.getDate())
    return pool
      .filter((s) => s.startAt.slice(0, 10) >= nowStr)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 3)
  }, [schedulesByMonth])

  return {
    displayedYear,
    displayedMonth,
    selectedDate,
    schedules,
    upcomingSchedules,
    loading,
    isCreateModalOpen,
    openCreateModal: () => setIsCreateModalOpen(true),
    closeCreateModal: () => setIsCreateModalOpen(false),
    handleMonthChange,
    handleDateSelect,
    handleAttendanceToggle,
    handleScheduleCreated,
    ensureUpcomingLoaded,
  }
}
