import type { ChatMessage } from '../../types/chat'
import { getInitials } from '../../utils/stringUtils'
import styles from './MessageBubble.module.css'

interface Props {
  message: ChatMessage
  isMyMessage: boolean
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessageBubble({ message, isMyMessage }: Props) {
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
        <span className={styles.time}>{formatTime(message.createdDate)}</span>
      </div>
    </div>
  )
}
