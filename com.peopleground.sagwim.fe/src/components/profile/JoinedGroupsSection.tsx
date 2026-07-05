import { useState } from 'react'
import { getInitials } from '../../utils/stringUtils'
import styles from './JoinedGroupsSection.module.css'
import type { GroupResponse } from '../../types/group'

interface JoinedGroupsSectionProps {
  groups: GroupResponse[]
  onGroupClick: (groupId: number) => void
}

function GroupCircle({
  group,
  onClick,
}: {
  group: GroupResponse
  onClick: () => void
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.itemButton}
        onClick={onClick}
        title={group.name}
      >
        <span className={styles.circle}>
          {group.imageUrl && !imgError ? (
            <img
              src={group.imageUrl}
              alt=""
              className={styles.circleImage}
              onError={() => setImgError(true)}
            />
          ) : (
            <span className={`avatar ${styles.circleFallback}`}>
              {getInitials(group.name)}
            </span>
          )}
        </span>
        <span className={styles.name}>{group.name}</span>
      </button>
    </li>
  )
}

export function JoinedGroupsSection({ groups, onGroupClick }: JoinedGroupsSectionProps) {
  return (
    <section className={styles.section} aria-label="가입한 모임">
      <h2 className={styles.sectionTitle}>가입한 모임</h2>
      <ul className={styles.track}>
        {groups.map((group) => (
          <GroupCircle
            key={group.id}
            group={group}
            onClick={() => onGroupClick(group.id)}
          />
        ))}
      </ul>
    </section>
  )
}
