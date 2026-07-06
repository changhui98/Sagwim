export function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

/** 이름 → 파스텔 톤 인덱스(0~5). 같은 이름은 항상 같은 색 (전역 .tone-N 클래스와 매칭) */
export function getPastelTone(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return Math.abs(hash) % 6
}

/** UI 표시 시 "대한민국 " prefix를 제거합니다. DB 저장 값은 변경하지 않습니다. */
export function removeKoreaPrefix(region: string | null | undefined): string | null {
  if (!region) return region ?? null
  return region.startsWith('대한민국 ') ? region.slice('대한민국 '.length) : region
}

/** region 문자열(예: "대한민국 서울특별시 강남구 삼성동")에서 가장 세부 행정구역(마지막 토큰)을 추출 */
export function extractLastRegionToken(region: string | null | undefined): string | null {
  if (!region) return null
  const trimmed = region.trim()
  if (!trimmed) return null
  const parts = trimmed.split(/\s+/)
  return parts[parts.length - 1] ?? null
}

/** region 문자열(예: "대한민국 서울특별시 강남구 삼성동")에서 구·동 2뎁스만 추출 ("강남구 삼성동") */
export function extractLastTwoRegionTokens(region: string | null | undefined): string | null {
  if (!region) return null
  const trimmed = region.trim()
  if (!trimmed) return null
  const parts = trimmed.split(/\s+/)
  return parts.slice(-2).join(' ') || null
}
