import { useMemo } from 'react'
import Holidays from 'date-holidays'
import type { ScheduleResponse } from '../../types/group'
import styles from './ScheduleCalendar.module.css'

interface ScheduleCalendarProps {
  year: number
  month: number // 0-indexed (0 = January)
  schedules: ScheduleResponse[]
  selectedDate: string | null
  onDateSelect: (date: string) => void
  onMonthChange: (year: number, month: number) => void
  /** 모임 정원이 거의 찼는지(마감 임박) — 예정 일정 점을 빨간 점등으로 표시 */
  groupAlmostFull?: boolean
}

/** 일정 점 상태. 하루에 여러 일정이면 우선순위가 높은 상태 하나로 표시한다. */
type DotStatus = 'soon' | 'urgent' | 'upcoming' | 'past'

const DOT_PRIORITY: Record<DotStatus, number> = { soon: 3, urgent: 2, upcoming: 1, past: 0 }

const DOT_STATUS_CLASS: Record<DotStatus, string> = {
  soon: 'dotSoon',
  urgent: 'dotUrgent',
  upcoming: 'dotUpcoming',
  past: 'dotPast',
}

const SOON_WINDOW_MS = 3 * 60 * 60 * 1000 // 시작 3시간 전부터 '곧 시작'

function getDotStatus(schedule: ScheduleResponse, now: Date, groupAlmostFull: boolean): DotStatus {
  const start = new Date(schedule.startAt).getTime()
  const end = new Date(schedule.endAt).getTime()
  const t = now.getTime()
  if (t > end) return 'past'
  if (t >= start - SOON_WINDOW_MS) return 'soon' // 시작 임박 + 진행 중
  return groupAlmostFull ? 'urgent' : 'upcoming'
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function toDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function getTodayString(): string {
  const today = new Date()
  return toDateString(today.getFullYear(), today.getMonth(), today.getDate())
}

interface HolidayInfo {
  name: string
  isSubstitute: boolean
}

function buildKoreanHolidayMap(year: number): Map<string, HolidayInfo> {
  const hd = new Holidays('KR')
  const base = hd
    .getHolidays(year)
    .filter((holiday) => holiday.type === 'public')
    .map((holiday) => ({
      date: holiday.date.slice(0, 10),
      name: holiday.name,
      isSubstitute:
        Boolean((holiday as { substitute?: boolean }).substitute) ||
        holiday.name.includes('대체공휴일'),
    }))

  // 근로자의 날(5/1)은 법정공휴일은 아니지만 국내 캘린더 기대값에 맞춰 별도 표기한다.
  const laborDay = `${year}-05-01`
  if (!base.some((h) => h.date === laborDay)) {
    base.push({ date: laborDay, name: '근로자의 날', isSubstitute: false })
  }

  const byDate = new Map<string, HolidayInfo>()
  base.forEach((holiday) => {
    byDate.set(holiday.date, { name: holiday.name, isSubstitute: holiday.isSubstitute })
  })

  // 라이브러리 누락 대비: 대체공휴일(예: 석가탄신일 일요일 -> 익일)을 보강 계산한다.
  const substituteEligible = new Set(['어린이날', '석가탄신일'])
  base.forEach((holiday) => {
    if (!substituteEligible.has(holiday.name)) return
    const dt = new Date(`${holiday.date}T00:00:00`)
    const day = dt.getDay()
    if (day !== 0 && day !== 6) return

    const cursor = new Date(dt)
    while (true) {
      cursor.setDate(cursor.getDate() + 1)
      const dd = cursor.getDay()
      const dateStr = toDateString(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
      const isWeekend = dd === 0 || dd === 6
      if (isWeekend || byDate.has(dateStr)) continue
      byDate.set(dateStr, { name: `${holiday.name} 대체공휴일`, isSubstitute: true })
      break
    }
  })

  return byDate
}

export function ScheduleCalendar({
  year,
  month,
  schedules,
  selectedDate,
  onDateSelect,
  onMonthChange,
  groupAlmostFull = false,
}: ScheduleCalendarProps) {
  const holidayMap = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`
    const all = buildKoreanHolidayMap(year)
    const monthly = new Map<string, HolidayInfo>()
    all.forEach((value, key) => {
      if (key.startsWith(monthPrefix)) monthly.set(key, value)
    })
    return monthly
  }, [year, month])

  const today = getTodayString()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfWeek = getFirstDayOfWeek(year, month)

  // 날짜(YYYY-MM-DD)별 일정 점 상태 — 하루 여러 일정이면 우선순위 높은 상태로 집계
  const scheduleStatusByDate = useMemo(() => {
    const now = new Date()
    const byDate = new Map<string, DotStatus>()
    schedules.forEach((s) => {
      const dateStr = s.startAt.slice(0, 10)
      const status = getDotStatus(s, now, groupAlmostFull)
      const prev = byDate.get(dateStr)
      if (!prev || DOT_PRIORITY[status] > DOT_PRIORITY[prev]) {
        byDate.set(dateStr, status)
      }
    })
    return byDate
  }, [schedules, groupAlmostFull])

  const handlePrevMonth = () => {
    if (month === 0) {
      onMonthChange(year - 1, 11)
    } else {
      onMonthChange(year, month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 11) {
      onMonthChange(year + 1, 0)
    } else {
      onMonthChange(year, month + 1)
    }
  }

  // 앞쪽 빈 칸 (이전 달)
  const leadingBlanks = Array.from({ length: firstDayOfWeek })

  // 실제 날짜 셀
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className={styles.calendar}>
      {/* 헤더: 월 이동 */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={handlePrevMonth}
          aria-label="이전 달"
        >
          &#8249;
        </button>
        <span className={styles.monthLabel}>
          {year}년 {MONTH_NAMES[month]}
        </span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={handleNextMonth}
          aria-label="다음 달"
        >
          &#8250;
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className={styles.grid}>
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={`${styles.weekdayCell} ${idx === 0 ? styles.sunday : ''} ${idx === 6 ? styles.saturday : ''}`}
          >
            {day}
          </div>
        ))}

        {/* 이전 달 빈 칸 */}
        {leadingBlanks.map((_, idx) => (
          <div key={`blank-${idx}`} className={styles.emptyCell} />
        ))}

        {/* 날짜 셀 */}
        {dayCells.map((day) => {
          const dateStr = toDateString(year, month, day)
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const dotStatus = scheduleStatusByDate.get(dateStr)
          const hasSchedule = dotStatus !== undefined
          const holidayInfo = holidayMap.get(dateStr)
          const holidayName = holidayInfo?.name
          const isSubstituteHoliday = holidayInfo?.isSubstitute ?? false
          const dayOfWeek = (firstDayOfWeek + day - 1) % 7

          return (
            <button
              key={day}
              type="button"
              className={[
                styles.dayCell,
                isToday ? styles.today : '',
                isSelected ? styles.selected : '',
                holidayName ? styles.holiday : '',
                isSubstituteHoliday ? styles.substituteHoliday : '',
                dayOfWeek === 0 ? styles.sunday : '',
                dayOfWeek === 6 ? styles.saturday : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onDateSelect(dateStr)}
              aria-label={`${year}년 ${month + 1}월 ${day}일${holidayName ? ` (${holidayName})` : ''}${hasSchedule ? ' (일정 있음)' : ''}`}
              aria-pressed={isSelected}
              title={holidayName ? `${holidayName}` : undefined}
            >
              <span className={styles.dayNumber}>{day}</span>
              {holidayName && (
                <span
                  className={`${styles.holidayName} ${isSubstituteHoliday ? styles.holidayNameSubstitute : ''}`}
                >
                  {holidayName}
                </span>
              )}
              {dotStatus && (
                <span
                  aria-hidden="true"
                  className={`${styles.scheduleDot} ${styles[DOT_STATUS_CLASS[dotStatus]]}`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
