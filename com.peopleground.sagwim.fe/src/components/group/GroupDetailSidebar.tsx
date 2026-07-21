import type { GroupDetailResponse } from '../../types/group'
import type { UseGroupSchedulesResult } from '../../hooks/useGroupSchedules'
import { GROUP_CATEGORY_LABELS, GROUP_MEETING_TYPE_LABELS } from '../../types/group'
import { removeKoreaPrefix } from '../../utils/stringUtils'
import { GroupScheduleSection } from './GroupScheduleSection'
import { isGroupAlmostFull } from '../../utils/groupUtils'
import styles from './GroupDetailSidebar.module.css'

interface GroupDetailSidebarProps {
  group: GroupDetailResponse
  likeCount: number
  isMember: boolean
  schedule: UseGroupSchedulesResult
}

/** 데스크톱(≥1024px) 전용 우측 사이드바 — 모임 요약 + 달력 상시 노출 */
export function GroupDetailSidebar({ group, likeCount, isMember, schedule }: GroupDetailSidebarProps) {
  return (
    <aside className={styles.sidebar} aria-label="모임 요약 및 일정">
      <div className={styles.summaryCard}>
        <div className={styles.badgeRow}>
          <span className={styles.categoryBadge}>{GROUP_CATEGORY_LABELS[group.category]}</span>
        </div>
        <div className={styles.statsRow}>
          <span>
            멤버 <strong>{group.currentMemberCount}</strong>/{group.maxMemberCount}
          </span>
          <span className={styles.statDot} aria-hidden="true">·</span>
          <span>
            좋아요 <strong>{likeCount}</strong>
          </span>
          <span className={styles.statDot} aria-hidden="true">·</span>
          <span>
            {group.meetingType === 'OFFLINE' && group.region
              ? removeKoreaPrefix(group.region)
              : GROUP_MEETING_TYPE_LABELS[group.meetingType]}
          </span>
        </div>
      </div>

      <div className={styles.calendarCard}>
        <GroupScheduleSection
          groupId={group.id}
          isMember={isMember}
          schedule={schedule}
          compact
          groupAlmostFull={isGroupAlmostFull(group.currentMemberCount, group.maxMemberCount)}
        />
      </div>
    </aside>
  )
}
