/**
 * Sagwim 디자인 토큰 — FE variables.css 1:1 매핑
 * var(--clr-accent) → colors.accent 형태로 사용
 */

export const colors = {
  // Brand Accent
  accent: '#F08080',
  accentHover: '#e06060',
  accentMuted: 'rgba(240, 128, 128, 0.12)',
  accentGlow: 'rgba(240, 128, 128, 0.25)',

  // Semantic
  error: '#ef4444',
  errorSoft: 'rgba(239, 68, 68, 0.10)',
  success: '#10b981',
  successSoft: 'rgba(16, 185, 129, 0.10)',
  warning: '#f59e0b',

  // Surface — Light Mode (기본)
  bg: '#F5F5F5',
  bgAlt: '#ebebeb',
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
