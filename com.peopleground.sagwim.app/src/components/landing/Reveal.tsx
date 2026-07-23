/**
 * Reveal — 스크롤 등장(1회성) 래퍼. FE의 .reveal/.revealVisible CSS 전환 대체.
 * opacity 0→1, translateY 22→0 (withTiming). 접근성 감속 모드면 즉시 완성 상태.
 */

import React, { useEffect, useRef } from 'react'
import { Dimensions, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { useRevealScroll } from '../../hooks/useRevealOnScroll'

interface RevealProps {
  /** 발화 후 추가 지연(ms) — 카드 스태거용 */
  delay?: number
  children: React.ReactNode
}

const DURATION = 550
const TRIGGER_RATIO = 0.9

export function Reveal({ delay = 0, children }: RevealProps) {
  const reducedMotion = useReducedMotion()
  const scrollCtx = useRevealScroll()
  const hostRef = useRef<View>(null)
  const revealed = useRef(false)

  const progress = useSharedValue(reducedMotion ? 1 : 0)

  useEffect(() => {
    if (reducedMotion || revealed.current) return

    const check = () => {
      if (revealed.current) return
      hostRef.current?.measureInWindow((_x, y, _w, h) => {
        if (revealed.current) return
        const winH = Dimensions.get('window').height
        if (y < winH * TRIGGER_RATIO && y + h > 0) {
          revealed.current = true
          progress.value = withDelay(delay, withTiming(1, { duration: DURATION }))
        }
      })
    }

    // 마운트 직후 above-the-fold 판정 (레이아웃 안정화 대기)
    const t = setTimeout(check, 80)
    const unsubscribe = scrollCtx?.subscribe(check)
    return () => {
      clearTimeout(t)
      unsubscribe?.()
    }
  }, [reducedMotion, scrollCtx, delay, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 22 }],
  }))

  return (
    <View ref={hostRef} collapsable={false}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </View>
  )
}
