import { useState } from 'react'
import type { ScheduleResponse } from '../../types/group'
import pinPointIcon from '../../assets/pin-point-svgrepo-com.svg'
import userHeartIcon from '../../assets/user-heart-svgrepo-com.svg'
import usersIcon from '../../assets/users-svgrepo-com.svg'
import styles from './ScheduleEventCard.module.css'

interface ScheduleEventCardProps {
  schedule: ScheduleResponse
  myUsername?: string | null
  onAttendanceToggle?: (scheduleId: number) => Promise<void>
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function ScheduleEventCard({ schedule, myUsername, onAttendanceToggle }: ScheduleEventCardProps) {
  const startTime = formatTime(schedule.startAt)
  const endTime = formatTime(schedule.endAt)
  const [toggling, setToggling] = useState(false)

  const handleAttendanceClick = async () => {
    if (!onAttendanceToggle || toggling) return
    setToggling(true)
    try {
      await onAttendanceToggle(schedule.id)
    } finally {
      setToggling(false)
    }
  }

  const showAttendanceRow = !!myUsername && !!onAttendanceToggle

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <p className={styles.title}>{schedule.title}</p>
          <span className={styles.creatorItem}>
            <img src={userHeartIcon} alt="등록자" className={styles.metaIcon} />
            {schedule.createdByNickname}
          </span>
        </div>
        {schedule.description && (
          <p className={styles.description}>{schedule.description}</p>
        )}
        <div className={styles.bottomRow}>
          {schedule.location ? (
            <span className={styles.metaItem}>
              <img src={pinPointIcon} alt="위치" className={styles.metaIcon} />
              {schedule.location}
            </span>
          ) : (
            <span />
          )}
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>🕐</span>
            {startTime} ~ {endTime}
          </span>
        </div>
        {showAttendanceRow && (
          <>
            <hr className={styles.divider} />
            <div className={styles.attendanceRow}>
              <button
                type="button"
                className={schedule.attendingByMe ? styles.attendBtnActive : styles.attendBtn}
                onClick={handleAttendanceClick}
                disabled={toggling}
              >
                {schedule.attendingByMe ? '✓ 참석 중' : '참석하기'}
              </button>
              <span className={styles.attendeeCount}>
                <img src={usersIcon} alt="참석자" className={styles.metaIcon} />
                {schedule.attendeeCount}명
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
