import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * 라우트 이동(PUSH/REPLACE) 시 window 스크롤을 맨 위로 초기화한다.
 * BrowserRouter에서는 <ScrollRestoration>을 쓸 수 없어 직접 구현.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    // 뒤로가기/앞으로가기(POP)는 브라우저 기본 스크롤 복원에 맡긴다
    if (navigationType === 'POP') return
    // 해시 앵커 이동은 앵커 스크롤에 맡긴다
    if (hash) return
    // html의 scroll-behavior: smooth를 무시하고 즉시 이동
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash, navigationType])

  return null
}
