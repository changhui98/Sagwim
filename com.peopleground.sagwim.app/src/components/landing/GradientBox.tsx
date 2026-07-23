/**
 * GradientBox — CSS linear-gradient 배경의 RN 대체.
 * react-native-svg의 LinearGradient Rect를 절대배치로 깔고 children을 위에 얹는다.
 * expo-linear-gradient 의존성 없이 랜딩의 pill 버튼·스텝 배지·타이틀 바·CTA 밴드를 커버.
 *
 * 주의: react-native-svg gradient id는 전역 공유 — useId()로 인스턴스별 고유 id를 강제한다.
 */

import React, { useId } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

export interface GradientStop {
  color: string
  /** 0~1. 생략 시 균등 분배 */
  offset?: number
  opacity?: number
}

interface GradientBoxProps {
  stops: readonly (GradientStop | string)[]
  /** diag = CSS 135deg(좌상→우하), vertical = 180deg(위→아래) */
  direction?: 'diag' | 'vertical'
  borderRadius?: number
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

export function GradientBox({ stops, direction = 'diag', borderRadius = 0, style, children }: GradientBoxProps) {
  const gradId = `gb-${useId().replace(/:/g, '')}`
  const coords = direction === 'vertical'
    ? { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
    : { x1: '0%', y1: '0%', x2: '100%', y2: '100%' }

  const normalized: GradientStop[] = stops.map((s, i) =>
    typeof s === 'string'
      ? { color: s, offset: stops.length > 1 ? i / (stops.length - 1) : 0 }
      : { offset: stops.length > 1 ? i / (stops.length - 1) : 0, ...s }
  )

  return (
    <View style={[style, { borderRadius, overflow: 'hidden' }]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id={gradId} {...coords}>
            {normalized.map((s, i) => (
              <Stop
                key={i}
                offset={`${Math.round((s.offset ?? 0) * 100)}%`}
                stopColor={s.color}
                stopOpacity={s.opacity ?? 1}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
      </Svg>
      {children}
    </View>
  )
}
