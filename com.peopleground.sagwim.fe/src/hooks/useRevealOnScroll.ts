import { useState } from 'react'
import { useIntersectionObserver } from './useIntersectionObserver'

interface UseRevealOnScrollOptions {
  /** 뷰포트 하단에서 얼마나 일찍 등장시킬지 (기본 -10%) */
  rootMargin?: string
  /** 요소가 이만큼 보이면 등장 (기본 0.15) */
  threshold?: number
}

interface UseRevealOnScrollResult {
  ref: React.RefCallback<HTMLDivElement>
  /** 한 번이라도 화면에 들어온 적이 있는지 (스크롤을 되돌려도 유지) */
  hasRevealed: boolean
}

/**
 * 섹션이 처음 화면에 들어오는 순간을 한 번만 감지해 그 상태를 고정한다.
 * 등장 애니메이션(slideUp 등)을 켜고 끄지 않고 "한 번 등장 후 유지"하기 위한 래퍼.
 */
export function useRevealOnScroll(
  options: UseRevealOnScrollOptions = {},
): UseRevealOnScrollResult {
  const { rootMargin = '0px 0px -10% 0px', threshold = 0.15 } = options
  const { ref, isIntersecting } = useIntersectionObserver({ rootMargin, threshold })
  const [hasRevealed, setHasRevealed] = useState(false)

  // 렌더 중 파생 상태 조정: 처음 화면에 들어오면 등장 상태를 고정한다.
  // (effect 없이 한 번만 true 로 전환되고 이후 유지된다)
  if (isIntersecting && !hasRevealed) {
    setHasRevealed(true)
  }

  return { ref, hasRevealed }
}
