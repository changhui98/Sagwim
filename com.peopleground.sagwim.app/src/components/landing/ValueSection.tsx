/**
 * ValueSection — FE landing/ValueSection.tsx 이식.
 * 가치 카드 3개(걸어서 닿는 거리 / 취향이 닿는 사람 / 부담 없는 시작) 세로 스택.
 * 아이콘은 웹 viewBox 24 path 그대로, 배지 색은 랜딩 pastel(다크 유채색 유지).
 */

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { useLandingPalette } from '../../constants/landing'
import { fontSize, radius, shadow, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'

interface ValueItem {
  title: string
  desc: string
  tone: number
  renderIcon: (color: string) => React.ReactNode
}

const ICON_SIZE = 26

const VALUES: ValueItem[] = [
  {
    title: '걸어서 닿는 거리',
    desc: '우리 동네, 가까운 이웃부터. 멀리 가지 않아도 만날 사람이 많아요.',
    tone: 0,
    renderIcon: (color) => (
      <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
          stroke={color} strokeWidth={1.8} strokeLinejoin="round"
        />
        <Circle cx={12} cy={10} r={2.6} stroke={color} strokeWidth={1.8} />
      </Svg>
    ),
  },
  {
    title: '취향이 닿는 사람',
    desc: '운동, 독서, 맛집, 게임까지. 좋아하는 게 같은 사람과 자연스럽게 이어져요.',
    tone: 3,
    renderIcon: (color) => (
      <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 20.5s-7-4.3-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 3.1c0 5.1-7 9.4-7 9.4Z"
          stroke={color} strokeWidth={1.8} strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    title: '부담 없는 시작',
    desc: '클릭 몇 번이면 충분해요. 모임 가입도, 새 모임 만들기도 가볍게.',
    tone: 4,
    renderIcon: (color) => (
      <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3.5l2.1 4.6 5 .6-3.7 3.4 1 5-4.4-2.5L7.6 17l1-5L4.9 8.7l5-.6L12 3.5Z"
          stroke={color} strokeWidth={1.8} strokeLinejoin="round"
        />
      </Svg>
    ),
  },
]

export function ValueSection() {
  const { colors } = useTheme()
  const { pastel } = useLandingPalette()

  const styles = React.useMemo(() => StyleSheet.create({
    section: {
      paddingVertical: spacing.sp10,
      paddingHorizontal: spacing.sp6,
    },
    grid: { gap: spacing.sp4 },
    card: {
      alignItems: 'flex-start',
      gap: spacing.sp3,
      padding: spacing.sp6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl2,
      ...shadow.md,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
    cardDesc: { fontSize: fontSize.md, lineHeight: 24, color: colors.textSecondary },
  }), [colors])

  return (
    <View style={styles.section}>
      <Reveal>
        <SectionHead
          title="동네가 더 가까워지는 이유"
          lead="사귐은 멀리 있는 친구가 아니라, 가까운 이웃과의 만남을 돕습니다."
        />
      </Reveal>

      <View style={styles.grid}>
        {VALUES.map((v, i) => (
          <Reveal key={v.title} delay={i * 100}>
            <View style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: pastel[v.tone].bg }]}>
                {v.renderIcon(pastel[v.tone].fg)}
              </View>
              <Text style={styles.cardTitle}>{v.title}</Text>
              <Text style={styles.cardDesc}>{v.desc}</Text>
            </View>
          </Reveal>
        ))}
      </View>
    </View>
  )
}
