/**
 * useRevealOnScroll — FE useRevealOnScroll(IntersectionObserver) 훅의 RN 대체.
 *
 * 랜딩 ScrollView가 스크롤 틱을 broadcast하면, 각 Reveal 컴포넌트가
 * measureInWindow로 자기 위치를 재서 뷰포트 90% 지점 위로 올라온 첫 순간
 * 1회성 등장 애니메이션을 발화한다. 중첩 뷰에서도 window 좌표라 정확하다.
 */

import { createContext, useCallback, useContext, useRef } from 'react'

type Listener = () => void

interface RevealScrollContextValue {
  subscribe: (fn: Listener) => () => void
  notify: () => void
}

export const RevealScrollContext = createContext<RevealScrollContextValue | null>(null)

export function useRevealScrollController(): RevealScrollContextValue {
  const listeners = useRef(new Set<Listener>())

  const subscribe = useCallback((fn: Listener) => {
    listeners.current.add(fn)
    return () => { listeners.current.delete(fn) }
  }, [])

  const notify = useCallback(() => {
    listeners.current.forEach((fn) => fn())
  }, [])

  return useRef({ subscribe, notify }).current
}

export function useRevealScroll(): RevealScrollContextValue | null {
  return useContext(RevealScrollContext)
}
