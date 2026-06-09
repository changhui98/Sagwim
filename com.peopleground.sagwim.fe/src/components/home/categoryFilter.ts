import { GROUP_CATEGORY_LABELS } from '../../types/group'
import type { GroupCategory } from '../../types/group'

/** 칩 키: 'ALL' | 1차 카테고리 전체 | 'ONLINE'(meetingType) */
export type CategoryChipKey = 'ALL' | GroupCategory | 'ONLINE'

// GROUP_CATEGORY_LABELS는 '🏃 운동 · 스포츠'처럼 앞에 이모지가 붙어있어 칩/제목에서는 텍스트만 사용
const stripEmoji = (label: string) => label.replace(/^\S+\s+/, '')

const CATEGORY_KEYS = Object.keys(GROUP_CATEGORY_LABELS) as GroupCategory[]

/** 칩 노출 순서: 전체 → 1차 카테고리 전체 → 온라인 */
export const CHIP_KEYS: CategoryChipKey[] = ['ALL', ...CATEGORY_KEYS, 'ONLINE']

/** 칩 키별 표시 라벨 (단일 그리드 제목 등에서 재사용) */
export const chipLabel = (key: CategoryChipKey): string => {
  if (key === 'ALL') return '전체'
  if (key === 'ONLINE') return '온라인'
  return stripEmoji(GROUP_CATEGORY_LABELS[key])
}
