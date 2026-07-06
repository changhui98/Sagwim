import { useSyncExternalStore } from 'react'

/** matchMedia 쿼리 결과를 구독하는 훅. CSS 미디어쿼리와 동일한 조건 문자열을 사용해야 한다. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    () => window.matchMedia(query).matches,
  )
}
