/**
 * BrandLogo — FE NavIcons.tsx의 BrandLogo SVG를 react-native-svg로 이식
 *
 * FE 원본: com.peopleground.sagwim.fe/src/components/NavIcons.tsx
 * viewBox: 0 0 256 256
 * 구조: 테두리 rect + 그라디언트 "A" 자 stroke 2개 + 흰 circle
 *
 * react-native-svg에서는 linearGradient id가 전역 공유되므로
 * 컴포넌트 인스턴스별 고정 id 사용 (화면당 1개만 렌더링 가정).
 */

import React from 'react'
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  G,
  Path,
  Circle,
} from 'react-native-svg'

interface BrandLogoProps {
  size?: number
}

export function BrandLogo({ size = 72 }: BrandLogoProps) {
  const gradId = 'sagwim-brand-grad'

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
    >
      <Defs>
        <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF9580" />
          <Stop offset="55%" stopColor="#FF6B6B" />
          <Stop offset="100%" stopColor="#E63E5C" />
        </LinearGradient>
      </Defs>

      {/* 외곽 테두리 */}
      <Rect
        x="4"
        y="4"
        width="248"
        height="248"
        rx="56"
        fill="none"
        stroke="#f08080"
        strokeWidth="4"
      />

      {/* "A" 자 형태 그라디언트 획 */}
      <G stroke={`url(#${gradId})`} strokeWidth="26" strokeLinecap="round" fill="none">
        <Path d="M128 78 L72 184" />
        <Path d="M128 78 L184 184" />
      </G>

      {/* 꼭짓점 강조 circle */}
      <Circle cx="128" cy="78" r="4" fill="#FFFFFF" opacity={0.8} />
    </Svg>
  )
}
