import { useEffect } from 'react'

/**
 * 모달이 열려 있을 때 특정 키 입력에 반응하여 onClose를 호출하는 훅.
 * isOpen이 false이면 이벤트 리스너를 등록하지 않는다.
 *
 * @param isOpen  모달 열림 여부
 * @param onClose 닫기 콜백
 * @param keys    반응할 키 목록 (기본값: ['Escape'])
 */
export function useModalKeyboard(
  isOpen: boolean,
  onClose: () => void,
  keys: string[] = ['Escape'],
): void {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (keys.includes(e.key)) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, keys])
}
