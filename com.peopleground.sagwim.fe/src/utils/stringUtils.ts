export function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

/** UI 표시 시 "대한민국 " prefix를 제거합니다. DB 저장 값은 변경하지 않습니다. */
export function removeKoreaPrefix(region: string | null | undefined): string | null {
  if (!region) return region ?? null
  return region.startsWith('대한민국 ') ? region.slice('대한민국 '.length) : region
}
