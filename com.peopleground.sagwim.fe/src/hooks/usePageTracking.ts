import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

/**
 * SPA 라우트 변경 시 GTM dataLayer에 가상 페이지뷰 이벤트를 push한다.
 * 문서가 새로 로드되지 않는 SPA에서도 화면 이동을 정확히 추적하기 위함.
 * GTM에서 'page_view' 커스텀 이벤트 트리거에 GA4 태그를 연결해 사용한다.
 */
export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'page_view',
      page_path: location.pathname + location.search,
      page_title: document.title,
    })
  }, [location])
}
