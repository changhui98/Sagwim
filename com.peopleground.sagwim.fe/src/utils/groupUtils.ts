/** 모임 정원 마감 임박 판정 — 정원 80% 이상 차 있으면서 남은 자리가 2자리 이하 */
export function isGroupAlmostFull(currentMemberCount: number, maxMemberCount: number): boolean {
  return (
    maxMemberCount > 0 &&
    currentMemberCount / maxMemberCount >= 0.8 &&
    maxMemberCount - currentMemberCount <= 2
  )
}
