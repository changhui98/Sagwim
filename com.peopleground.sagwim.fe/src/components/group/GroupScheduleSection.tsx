import { useAuth } from '../../context/AuthContext'
import type { UseGroupSchedulesResult } from '../../hooks/useGroupSchedules'
import { ScheduleCalendar } from './ScheduleCalendar'
import { ScheduleEventList } from './ScheduleEventList'
import { ScheduleCreateModal } from './ScheduleCreateModal'
import styles from './GroupScheduleSection.module.css'

interface GroupScheduleSectionProps {
  groupId: number
  isMember: boolean
  schedule: UseGroupSchedulesResult
  /** 사이드바 배치용 축소 스타일 */
  compact?: boolean
}

/** 달력 + 선택 날짜 일정 목록 + 일정 등록 모달. 상태는 useGroupSchedules가 소유한다. */
export function GroupScheduleSection({ groupId, isMember, schedule, compact = false }: GroupScheduleSectionProps) {
  const { meUsername } = useAuth()
  const {
    displayedYear,
    displayedMonth,
    selectedDate,
    schedules,
    loading,
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    handleMonthChange,
    handleDateSelect,
    handleAttendanceToggle,
    handleScheduleCreated,
  } = schedule

  return (
    <div className={`${styles.wrapper} ${compact ? styles.wrapperCompact : ''}`}>
      {/* 캘린더: 로딩 중에도 DOM을 유지해 스크롤 점프를 막는다 */}
      <ScheduleCalendar
        year={displayedYear}
        month={displayedMonth}
        schedules={schedules}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onMonthChange={handleMonthChange}
      />
      {loading && (
        <div className={styles.loadingInline} aria-live="polite">
          <span className={styles.loadingText}>일정을 불러오는 중...</span>
        </div>
      )}

      {/* 선택된 날짜의 일정 목록 */}
      <ScheduleEventList
        selectedDate={selectedDate}
        schedules={schedules}
        canCreate={isMember}
        onCreateClick={openCreateModal}
        myUsername={isMember ? meUsername : null}
        onAttendanceToggle={isMember ? handleAttendanceToggle : undefined}
      />

      {/* 일정 등록 모달 */}
      <ScheduleCreateModal
        isOpen={isCreateModalOpen}
        groupId={groupId}
        onClose={closeCreateModal}
        onCreated={handleScheduleCreated}
      />
    </div>
  )
}
