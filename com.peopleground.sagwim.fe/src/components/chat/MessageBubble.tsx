import type { ChatMessage } from '../../types/chat'
import { getInitials } from '../../utils/stringUtils'
import styles from './MessageBubble.module.css'

interface Props {
  message: ChatMessage
  isMyMessage: boolean
  /** 그룹의 마지막 메시지 여부 — true일 때만 시간을 표시한다 */
  showTime: boolean
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessageBubble({ message, isMyMessage, showTime }: Props) {
  if (message.type === 'SYSTEM') {
    return <div className={styles.system}>{message.content}</div>
  }

  return (
    <div className={`${styles.wrapper} ${isMyMessage ? styles.mine : ''}`}>
      {!isMyMessage && (
        <div className={styles.avatar}>
          {message.senderProfileImageUrl ? (
            <img src={message.senderProfileImageUrl} alt={message.senderNickname} />
          ) : (
            getInitials(message.senderNickname)
          )}
        </div>
      )}
      <div className={styles.content}>
        {!isMyMessage && (
          <span className={styles.senderName}>{message.senderNickname}</span>
        )}
        <div className={styles.bubble}>{message.content}</div>
        {showTime && (
          <span className={styles.time}>{formatTime(message.createdDate)}</span>
        )}
      </div>
    </div>
  )
}
