import { useEffect, useState } from 'react'

/**
 * 값이 바뀐 뒤 delay(ms) 동안 추가 변경이 없을 때만 갱신되는 디바운스 값을 반환한다.
 * 검색어 입력 등에서 매 키 입력마다 서버 요청이 나가지 않도록 사용한다.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
