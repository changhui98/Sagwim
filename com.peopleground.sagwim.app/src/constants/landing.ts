/**
 * 랜딩 전용 미드톤 팔레트 — FE ServiceHomePage.module.css의 --lp-tone-0~5 1:1 매핑.
 * Pantone Serenity(#91A8D0, 앱 accent) 공식 페어링 계열.
 *
 * 다크에서도 랜딩만 유채색을 유지한다(웹과 동일 규칙) — 전역 theme.ts 다크는
 * 무채색 컨셉이므로, 랜딩 컴포넌트는 colors.pastel 대신 여기의 useLandingPalette()를 쓴다.
 */

import { useTheme } from '../context/ThemeContext'
import { lightColors } from './theme'

/** 라이트 톤 — 세레니티·라벤더·로즈·세이지·아프리콧·아쿠아 */
export const lpTonesLight = ['#91A8D0', '#AFA5D6', '#D9A0B0', '#8FC2A9', '#E5BC85', '#85C6CD'] as const

/** 다크 톤 — 같은 휴에서 채도·명도 한 단계 감쇠 */
export const lpTonesDark = ['#8399BC', '#9C93BE', '#C0919F', '#82AE98', '#CBA97D', '#7AB1B7'] as const

/** 다크 랜딩 한정 pastel 복색 브리지 (ServiceHomePage.module.css 다크 블록 그대로) */
export const landingPastelDark = [
  { bg: 'rgba(145, 168, 208, 0.16)', fg: '#aec1e4' },
  { bg: 'rgba(175, 165, 214, 0.16)', fg: '#c3b9e6' },
  { bg: 'rgba(217, 160, 176, 0.16)', fg: '#e2b3c1' },
  { bg: 'rgba(143, 194, 169, 0.16)', fg: '#a5cdb8' },
  { bg: 'rgba(229, 188, 133, 0.16)', fg: '#e3c79d' },
  { bg: 'rgba(133, 198, 205, 0.16)', fg: '#9fcfd5' },
] as const

export interface LandingPalette {
  tones: readonly string[]
  pastel: readonly { bg: string; fg: string }[]
  isDark: boolean
}

export function useLandingPalette(): LandingPalette {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return isDark
    ? { tones: lpTonesDark, pastel: landingPastelDark, isDark }
    : { tones: lpTonesLight, pastel: lightColors.pastel, isDark }
}
