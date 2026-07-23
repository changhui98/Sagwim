/**
 * HeroSection — FE landing/HeroSection.tsx의 모바일(767px 이하) 레이아웃 이식.
 * 비주얼(한반도)이 위, 카피·CTA가 아래로 세로 스택, 중앙 정렬.
 * 앱 랜딩은 항상 비로그인이므로 회원용 카피 분기는 이식하지 않는다.
 */

import React from 'react'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg'
import { useLandingPalette } from '../../constants/landing'
import { fontSize, radius, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { GradientBox } from './GradientBox'
import { KoreaMapVisual } from './KoreaMapVisual'

interface HeroSectionProps {
  onPressPrimary: () => void
  onPressSecondary: () => void
}

export function HeroSection({ onPressPrimary, onPressSecondary }: HeroSectionProps) {
  const { colors } = useTheme()
  const { tones } = useLandingPalette()
  const { width: winW } = useWindowDimensions()
  // react-native-svg의 percent 좌표가 absoluteFill 크기를 못 잡는 경우가 있어 실측 크기로 렌더
  const [size, setSize] = React.useState({ w: 0, h: 0 })

  const styles = React.useMemo(() => StyleSheet.create({
    hero: { position: 'relative', overflow: 'hidden' },
    inner: {
      paddingVertical: spacing.sp8,
      paddingHorizontal: spacing.sp6,
      alignItems: 'center',
      gap: spacing.sp6,
    },
    copy: { alignItems: 'center', gap: spacing.sp5 },
    eyebrow: {
      paddingVertical: spacing.sp1,
      paddingHorizontal: spacing.sp3,
      borderRadius: radius.full,
      backgroundColor: colors.accentMuted,
      borderWidth: 1,
      borderColor: colors.lavenderMuted,
      overflow: 'hidden',
    },
    eyebrowText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      lineHeight: 38,
      letterSpacing: -0.9,
      color: colors.text,
      textAlign: 'center',
    },
    titleAccent: { color: colors.accent },
    subtitle: {
      maxWidth: 480,
      fontSize: fontSize.md,
      lineHeight: 25,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    brand: { color: colors.accent, fontWeight: '600' },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sp3,
      marginTop: spacing.sp3,
    },
    btnPrimary: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 4,
      borderRadius: radius.full,
    },
    btnPrimaryInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sp2,
      paddingVertical: spacing.sp3,
      paddingHorizontal: spacing.sp6,
    },
    btnPrimaryText: { color: colors.onAccent, fontSize: fontSize.lg, fontWeight: '600' },
    btnSecondary: {
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      paddingVertical: spacing.sp3,
      paddingHorizontal: spacing.sp6,
      justifyContent: 'center',
    },
    btnSecondaryText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
    visual: { alignItems: 'center' },
    pressed: { opacity: 0.85 },
  }), [colors])

  return (
    <View
      style={styles.hero}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout
        setSize({ w: width, h: height })
      }}
    >
      {/* 배경 글로우 — 우상단 세레니티 + 좌하단 라벤더 + 좌상단 아프리콧 한 방울 */}
      {size.w > 0 && (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="hero-glow-0" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.12} />
              <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="hero-glow-1" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.lavender} stopOpacity={0.14} />
              <Stop offset="100%" stopColor={colors.lavender} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="hero-glow-2" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={tones[4]} stopOpacity={0.12} />
              <Stop offset="100%" stopColor={tones[4]} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={size.w * 0.78} cy={size.h * 0.3} rx={winW * 0.6} ry={size.h * 0.55} fill="url(#hero-glow-0)" />
          <Ellipse cx={size.w * 0.12} cy={size.h * 0.8} rx={winW * 0.5} ry={size.h * 0.5} fill="url(#hero-glow-1)" />
          <Ellipse cx={size.w * 0.18} cy={size.h * 0.12} rx={winW * 0.4} ry={size.h * 0.35} fill="url(#hero-glow-2)" />
        </Svg>
      )}

      <View style={styles.inner}>
        <Animated.View entering={FadeInUp.duration(700).delay(100)} style={styles.visual}>
          <KoreaMapVisual width={210} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600)} style={styles.copy}>
          <View style={styles.eyebrow}>
            <Text style={styles.eyebrowText}>이웃과 함께하는 동네 모임</Text>
          </View>
          <Text style={styles.title}>
            가까운 동네에서{'\n'}마음 맞는 <Text style={styles.titleAccent}>이웃</Text>을 만나요
          </Text>
          <Text style={styles.subtitle}>
            우리 동네 곳곳의 사람들이 <Text style={styles.brand}>사귐</Text>으로 이어집니다. 취향이
            닿는 모임을 찾고, 이야기를 나누고, 실시간으로 소통해 보세요.
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onPressPrimary}
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <GradientBox stops={colors.accentGradient} borderRadius={radius.full}>
                <View style={styles.btnPrimaryInner}>
                  <Text style={styles.btnPrimaryText}>지금 시작하기</Text>
                  <Text style={styles.btnPrimaryText}>→</Text>
                </View>
              </GradientBox>
            </Pressable>
            <Pressable
              onPress={onPressSecondary}
              style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.btnSecondaryText}>로그인</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  )
}
