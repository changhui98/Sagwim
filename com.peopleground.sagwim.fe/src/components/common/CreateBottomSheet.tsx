import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useModalKeyboard } from '../../hooks/useModalKeyboard'
import groupIcon from '../../assets/moim-icon-2-three-people.svg'
import postIcon from '../../assets/clipboard-list-alt-svgrepo-com.svg'
import styles from './CreateBottomSheet.module.css'

interface CreateBottomSheetProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 모바일 하단 바 가운데 만들기(+) 버튼 탭 시 올라오는 바텀시트.
 * 화면 전환 없이 모임 만들기 / 게시글 쓰기 중 하나를 고른다.
 * (데스크톱 만들기 진입은 기존 /app/create — CreateSelectPage — 유지)
 */
export function CreateBottomSheet({ isOpen, onClose }: CreateBottomSheetProps) {
  const navigate = useNavigate()
  useModalKeyboard(isOpen, onClose)

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  const go = (path: string) => {
    onClose()
    navigate(path)
  }

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="만들기"
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <span className={styles.grabber} aria-hidden="true" />
        <h2 className={styles.title}>무엇을 만들까요?</h2>
        <div className={styles.items}>
          <button
            type="button"
            className={styles.item}
            onClick={() => go('/app/groups/new')}
            autoFocus
          >
            <span className={styles.itemIconWrap}>
              <img src={groupIcon} alt="" className={styles.itemIcon} aria-hidden="true" />
            </span>
            <span className={styles.itemText}>
              <span className={styles.itemLabel}>모임 만들기</span>
              <span className={styles.itemDesc}>새로운 모임을 개설해보세요</span>
            </span>
          </button>

          <button
            type="button"
            className={styles.item}
            onClick={() => go('/app/posts/new')}
          >
            <span className={styles.itemIconWrap}>
              <img src={postIcon} alt="" className={styles.itemIcon} aria-hidden="true" />
            </span>
            <span className={styles.itemText}>
              <span className={styles.itemLabel}>게시글 쓰기</span>
              <span className={styles.itemDesc}>자유롭게 글을 작성해보세요</span>
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
