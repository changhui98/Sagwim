/**
 * CtaSection — FE landing/CtaSection.tsx 이식.
 * 풀폭 수직 그라데이션 밴드(위 투명 → 세레니티 → 라벤더) + 좌하 아쿠아·우하 로즈 코너 글로우.
 * 앱 랜딩은 항상 비로그인이므로 비회원 카피 고정.
 */

import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useLandingPalette } from '../../constants/landing'
import { fontSize, radius, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { GradientBox } from './GradientBox'
import { Reveal } from './Reveal'

interface CtaSectionProps {
  onPressPrimary: () => void
  onPressSecondary: () => void
}

export function CtaSection({ onPressPrimary, onPressSecondary }: CtaSectionProps) {
  const { colors } = useTheme()
  const { tones, isDark } = useLandingPalette()
  // react-native-svg의 percent 좌표가 absoluteFill 크기를 못 잡는 경우가 있어 실측 크기로 렌더
  const [size, setSize] = React.useState({ w: 0, h: 0 })

  // 다크는 저알파를 더 절제 (웹 다크 블록: 6%/10%)
  const bandMidOpacity = isDark ? 0.06 : 0.08
  const bandEndOpacity = isDark ? 0.10 : 0.14

  const styles = React.useMemo(() => StyleSheet.create({
    section: {
      position: 'relative',
      overflow: 'hidden',
      paddingVertical: spacing.sp10,
      paddingHorizontal: spacing.sp6,
    },
    banner: { alignItems: 'center' },
    titleBar: { width: 40, height: 4, marginBottom: spacing.sp4 },
    title: {
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 32,
      letterSpacing: -0.7,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.sp3,
    },
    desc: {
      fontSize: fontSize.md,
      lineHeight: 24,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sp6,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sp3,
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
    pressed: { opacity: 0.85 },
  }), [colors])

  return (
    <View
      style={styles.section}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout
        setSize({ w: width, h: height })
      }}
    >
      {/* 밴드 배경 + 코너 글로우 */}
      {size.w > 0 && (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id="cta-band" x1="0" y1="0" x2="0" y2={size.h}
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={tones[0]} stopOpacity={0} />
              <Stop offset="0.45" stopColor={tones[0]} stopOpacity={bandMidOpacity} />
              <Stop offset="1" stopColor={tones[1]} stopOpacity={bandEndOpacity} />
            </LinearGradient>
            <RadialGradient id="cta-glow-l" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={tones[5]} stopOpacity={0.12} />
              <Stop offset="100%" stopColor={tones[5]} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="cta-glow-r" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={tones[2]} stopOpacity={0.10} />
              <Stop offset="100%" stopColor={tones[2]} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#cta-band)" />
          <Ellipse cx={size.w * 0.1} cy={size.h} rx={size.w * 0.55} ry={size.h * 0.6} fill="url(#cta-glow-l)" />
          <Ellipse cx={size.w * 0.9} cy={size.h} rx={size.w * 0.55} ry={size.h * 0.6} fill="url(#cta-glow-r)" />
        </Svg>
      )}

      <Reveal>
        <View style={styles.banner}>
          <GradientBox stops={colors.duoGradient} borderRadius={radius.full} style={styles.titleBar} />
          <Text style={styles.title}>오늘, 우리 동네에서{'\n'}첫 모임을 시작해 보세요</Text>
          <Text style={styles.desc}>가입은 1분이면 충분해요. 가까운 이웃이 기다리고 있어요.</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onPressPrimary}
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <GradientBox stops={colors.accentGradient} borderRadius={radius.full}>
                <View style={styles.btnPrimaryInner}>
                  <Text style={styles.btnPrimaryText}>무료로 시작하기</Text>
                  <Text style={styles.btnPrimaryText}>→</Text>
                </View>
              </GradientBox>
            </Pressable>
            <Pressable
              onPress={onPressSecondary}
              style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.btnSecondaryText}>이미 회원이에요</Text>
            </Pressable>
          </View>
        </View>
      </Reveal>
    </View>
  )
}
