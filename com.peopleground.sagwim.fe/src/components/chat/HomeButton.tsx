import { useNavigate } from 'react-router-dom'
import { HomeIcon } from '../NavIcons'
import styles from './HomeButton.module.css'

interface Props {
  variant: 'header' | 'floating'
}

/**
 * 홈(/)으로 이동하는 버튼.
 * - header: ChatRoomView 상단바 우측 끝에 absolute 고정
 * - floating: 우측 하단 fixed FAB (ChatFab과 동일한 위치/크기)
 */
export function HomeButton({ variant }: Props) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className={variant === 'header' ? styles.header : styles.floating}
      onClick={() => navigate('/app')}
      aria-label="홈으로 이동"
    >
      <HomeIcon width={variant === 'header' ? 22 : 24} height={variant === 'header' ? 22 : 24} />
    </button>
  )
}
