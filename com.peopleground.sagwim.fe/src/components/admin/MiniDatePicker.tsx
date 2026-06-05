import { useEffect, useMemo, useRef, useState } from 'react'
import s from './MiniDatePicker.module.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

interface MiniDatePickerProps {
  /** YYYY-MM-DD */
  value: string
  onChange: (value: string) => void
  /** YYYY-MM-DD (inclusive) */
  min?: string
  max?: string
}

function CalendarIcon() {
  return (
    <svg
      className={s.calIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

export function MiniDatePicker({ value, onChange, min, max }: MiniDatePickerProps) {
  const [open, setOpen] = useState(false)
  const initial = value ? new Date(`${value}T00:00:00`) : new Date()
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() })
  const wrapRef = useRef<HTMLDivElement>(null)

  // 팝오버를 열 때 현재 value 기준 월로 뷰를 맞춘다
  const openPicker = () => {
    if (value) {
      const d = new Date(`${value}T00:00:00`)
      setView({ y: d.getFullYear(), m: d.getMonth() })
    }
    setOpen(true)
  }

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const { firstDay, dayCount } = useMemo(
    () => ({
      firstDay: new Date(view.y, view.m, 1).getDay(),
      dayCount: new Date(view.y, view.m + 1, 0).getDate(),
    }),
    [view],
  )

  const todayStr = (() => {
    const n = new Date()
    return ymd(n.getFullYear(), n.getMonth(), n.getDate())
  })()

  const isDisabled = (dateStr: string): boolean =>
    (!!min && dateStr < min) || (!!max && dateStr > max)

  const handleSelect = (day: number) => {
    const ds = ymd(view.y, view.m, day)
    if (isDisabled(ds)) return
    onChange(ds)
    setOpen(false)
  }

  const handlePrev = () =>
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))
  const handleNext = () =>
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))

  const handleToday = () => {
    if (!isDisabled(todayStr)) onChange(todayStr)
    const n = new Date()
    setView({ y: n.getFullYear(), m: n.getMonth() })
    setOpen(false)
  }

  const display = value ? value.replace(/-/g, '.') : '선택'

  return (
    <div className={s.wrap} ref={wrapRef}>
      <button
        type="button"
        className={open ? s.triggerOpen : s.trigger}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        <CalendarIcon />
        {display}
      </button>

      {open && (
        <div className={s.popover}>
          <div className={s.head}>
            <button type="button" className={s.navBtn} onClick={handlePrev} aria-label="이전 달">
              ‹
            </button>
            <span className={s.monthLabel}>
              {view.y}년 {MONTH_NAMES[view.m]}
            </span>
            <button type="button" className={s.navBtn} onClick={handleNext} aria-label="다음 달">
              ›
            </button>
          </div>

          <div className={s.grid}>
            {WEEKDAYS.map((w) => (
              <div key={w} className={s.weekday}>
                {w}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`blank-${i}`} className={s.blank} />
            ))}
            {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
              const ds = ymd(view.y, view.m, day)
              const disabled = isDisabled(ds)
              const selected = ds === value
              const isToday = ds === todayStr
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  className={[
                    s.day,
                    selected ? s.daySelected : '',
                    isToday && !selected ? s.dayToday : '',
                    disabled ? s.dayDisabled : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleSelect(day)}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className={s.foot}>
            <button type="button" className={s.todayBtn} onClick={handleToday}>
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
