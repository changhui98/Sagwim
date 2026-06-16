import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * SPA 라우트 변경 시 GA4(gtag.js)로 page_view 이벤트를 전송한다.
 * index.html의 gtag config에서 자동 page_view(send_page_view)를 꺼 두었으므로,
 * 첫 진입을 포함한 모든 라우트 이동을 이 훅이 명시적으로 전송한다(중복 없음).
 */
export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window.gtag !== 'function') return
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title,
      page_location: window.location.href,
    })
  }, [location])
}
