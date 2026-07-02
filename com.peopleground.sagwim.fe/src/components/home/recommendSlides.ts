import type { GroupResponse } from '../../types/group'

/** 추천 배너 슬라이드 — 실제 모임 또는 정적 서비스 배너 */
export type RecommendSlide =
  | { kind: 'group'; key: string; group: GroupResponse }
  | {
      kind: 'static'
      key: string
      title: string
      description: string
      ctaLabel: string
      to: string
    }

/** 지역에 노출할 모임이 하나도 없을 때 보여줄 정적 서비스 배너 */
export const STATIC_SLIDES: RecommendSlide[] = [
  {
    kind: 'static',
    key: 'static-create',
    title: '우리 동네 첫 모임을 열어보세요',
    description: '취미가 같은 이웃이 기다리고 있어요',
    ctaLabel: '모임 만들기',
    to: '/app/create',
  },
  {
    kind: 'static',
    key: 'static-range',
    title: '노출 범위를 넓혀보세요',
    description: '조금 더 멀리 보면 새로운 모임이 보여요',
    ctaLabel: '범위 설정',
    to: '/app/profile/edit/address',
  },
]

/** 배너에 노출할 최대 모임 수 */
const MAX_GROUP_SLIDES = 3

/**
 * 인기 → 마감임박 → 신규 → 동네 전체 순으로 모임을 채워 배너 슬라이드를 만듭니다.
 * 노출할 모임이 하나도 없으면 정적 서비스 배너로 대체해 배너가 사라지지 않게 합니다.
 */
export function buildRecommendSlides(
  popular: GroupResponse[],
  deadline: GroupResponse[],
  recent: GroupResponse[],
  neighborhood: GroupResponse[],
): RecommendSlide[] {
  const seen = new Set<number>()
  const picked: GroupResponse[] = []

  for (const group of [...popular, ...deadline, ...recent, ...neighborhood]) {
    if (picked.length >= MAX_GROUP_SLIDES) break
    if (group.status !== 'ACTIVE' || seen.has(group.id)) continue
    seen.add(group.id)
    picked.push(group)
  }

  if (picked.length === 0) return STATIC_SLIDES

  return picked.map((group) => ({
    kind: 'group',
    key: `group-${group.id}`,
    group,
  }))
}
