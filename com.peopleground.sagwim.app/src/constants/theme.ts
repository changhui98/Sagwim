/**
 * Sagwim 디자인 토큰 — FE variables.css 1:1 매핑
 * var(--clr-accent) → colors.accent 형태로 사용
 */

export const lightColors = {
  // Brand Accent — 세레니티 블루
  accent: '#91A8D0',
  accentHover: '#7B92BC',
  accentMuted: 'rgba(145, 168, 208, 0.12)',
  accentGlow: 'rgba(145, 168, 208, 0.25)',
  onAccent: '#ffffff',

  // Secondary — Lavender (세레니티와 짝을 이루는 보조색)
  lavender: '#AFA5D6',
  lavenderStrong: '#7A6EAE',
  lavenderMuted: 'rgba(175, 165, 214, 0.14)',
  lavenderSoft: '#F2EFF9',

  // Gradient stops (react-native-svg LinearGradient용)
  accentGradient: ['#91A8D0', '#B3C4E0'],
  duoGradient: ['#91A8D0', '#AFA5D6'],

  // Pastel set — 칩·아바타 이니셜용 bg/fg 쌍
  pastel: [
    { bg: '#E8EEF7', fg: '#54689B' }, // 세레니티
    { bg: '#F2EFF9', fg: '#6C5FA3' }, // 라벤더
    { bg: '#F7EAEF', fg: '#96536E' }, // 로즈
    { bg: '#E7F3EC', fg: '#3B7354' }, // 세이지
    { bg: '#FBF0E1', fg: '#8F612C' }, // 아프리콧
    { bg: '#E3F1F3', fg: '#3B717B' }, // 아쿠아
  ],

  // Semantic
  error: '#ef4444',
  errorSoft: 'rgba(239, 68, 68, 0.10)',
  success: '#10b981',
  successSoft: 'rgba(16, 185, 129, 0.10)',
  warning: '#f59e0b',

  // Surface — Light Mode (기본)
  bg: '#ffffff',
  bgAlt: '#f5f5f5',
  surface: '#ffffff',
  surface2: '#f9f9f9',
  surface3: '#f0f0f0',
  border: 'rgba(0, 0, 0, 0.08)',
  borderStrong: 'rgba(0, 0, 0, 0.14)',
  text: '#1a1a1a',
  textSecondary: '#555555',
  textMuted: '#888888',

  // OAuth Buttons (비활성 처리용)
  kakaoYellow: '#FEE500',
  googleWhite: '#ffffff',
  oauthDisabled: '#d1d5db',
  oauthDisabledText: '#9ca3af',
} as const

export const darkColors = {
  // Brand Accent — 다크는 모노톤(흰색 강조) 컨셉
  accent: '#fafafa',
  accentHover: '#ffffff',
  accentMuted: 'rgba(255, 255, 255, 0.12)',
  accentGlow: 'rgba(255, 255, 255, 0.16)',
  onAccent: '#0a0a0a',

  // Secondary — 무채색 반전
  lavender: '#d4d4d4',
  lavenderStrong: '#d4d4d4',
  lavenderMuted: 'rgba(255, 255, 255, 0.10)',
  lavenderSoft: 'rgba(255, 255, 255, 0.06)',

  // Gradient stops
  accentGradient: ['#fafafa', '#d4d4d4'],
  duoGradient: ['#fafafa', '#b8b8b8'],

  // Pastel — 다크는 통일 무채색
  pastel: [
    { bg: 'rgba(255, 255, 255, 0.08)', fg: '#d4d4d4' },
    { bg: 'rgba(255, 255, 255, 0.08)', fg: '#d4d4d4' },
    { bg: 'rgba(255, 255, 255, 0.08)', fg: '#d4d4d4' },
    { bg: 'rgba(255, 255, 255, 0.08)', fg: '#d4d4d4' },
    { bg: 'rgba(255, 255, 255, 0.08)', fg: '#d4d4d4' },
    { bg: 'rgba(255, 255, 255, 0.08)', fg: '#d4d4d4' },
  ],

  // Semantic (동일)
  error: '#ef4444',
  errorSoft: 'rgba(239, 68, 68, 0.10)',
  success: '#10b981',
  successSoft: 'rgba(16, 185, 129, 0.10)',
  warning: '#f59e0b',
  // Surface — Dark Mode (뉴트럴 블랙, 평평)
  bg: '#0a0a0a',
  bgAlt: '#0d0d0d',
  surface: '#0d0d0d',
  surface2: '#161616',
  surface3: '#202020',
  border: 'rgba(255, 255, 255, 0.09)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  text: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#6e6e6e',
  // OAuth (동일)
  kakaoYellow: '#FEE500',
  googleWhite: '#ffffff',
  oauthDisabled: '#d1d5db',
  oauthDisabledText: '#9ca3af',
} as const

// 기존 colors export는 lightColors로 유지 (기존 코드 호환)
export const colors = lightColors

export type AppColors = typeof lightColors | typeof darkColors

export const spacing = {
  sp1: 4,
  sp2: 8,
  sp3: 12,
  sp4: 16,
  sp5: 20,
  sp6: 24,
  sp8: 32,
  sp10: 40,
  sp12: 48,
  sp16: 64,
} as const

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xl2: 28,
  full: 9999,
} as const

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  xl2: 20,
  xl3: 24,
  xl4: 28,
} as const

export const shadow = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 4,
  },
} as const
