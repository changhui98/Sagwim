import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusSquareIcon, HeartIcon } from './NavIcons'
import { CreateTypeSelectorModal } from './common/CreateTypeSelectorModal'
import { usePostCreateModal } from '../context/PostCreateModalContext'
import { useNotificationCount } from '../context/NotificationCountContext'
import styles from './MobileHeader.module.css'

export function MobileHeader() {
  const navigate = useNavigate()
  const { open: openPostCreateModal } = usePostCreateModal()
  const { unreadCount } = useNotificationCount()
  const [createFlow, setCreateFlow] = useState<'idle' | 'selecting'>('idle')

  const handleNotificationsClick = () => {
    navigate('/app/notifications')
  }

  return (
    <>
      <header className={styles.header}>
        {/* 좌측: + 버튼 */}
        <button
          type="button"
          className={styles.plusButton}
          onClick={() => setCreateFlow('selecting')}
          aria-label="새 모임 만들기"
        >
          <PlusSquareIcon width={22} height={22} />
        </button>

        {/* 가운데: 브랜드 로고 */}
        <div className={styles.brandName}>Sagwim</div>

        {/* 우측: 알림 버튼 */}
        <div className={styles.rightButtons}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={handleNotificationsClick}
            aria-label="알림"
          >
            <span className={styles.notifIconWrap}>
              <HeartIcon width={22} height={22} />
              {unreadCount > 0 && (
                <span
                  className={styles.unreadBadge}
                  aria-label={`읽지 않은 알림 ${unreadCount}건`}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
          </button>
        </div>
      </header>

      <CreateTypeSelectorModal
        isOpen={createFlow === 'selecting'}
        onClose={() => setCreateFlow('idle')}
        onSelectPost={() => { setCreateFlow('idle'); openPostCreateModal() }}
        onSelectGroup={() => { setCreateFlow('idle'); navigate('/app/groups/new') }}
      />
    </>
  )
}
