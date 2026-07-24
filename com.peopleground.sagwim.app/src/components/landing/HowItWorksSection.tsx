/**
 * HowItWorksSection — FE landing/HowItWorksSection.tsx 이식.
 * 3단계 스텝 카드, 배지는 랜딩 팔레트 듀오 그라데이션(01 세레니티→라벤더,
 * 02 세이지→아쿠아, 03 로즈→아프리콧)으로 진행감을 준다.
 */

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useLandingPalette } from '../../constants/landing'
import { fontSize, radius, shadow, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { GradientBox } from './GradientBox'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'

const STEPS = [
  {
    no: '01',
    title: '가입하고 동네 설정',
    desc: '간단한 회원가입으로 시작해요. 우리 동네만 정하면 준비 끝.',
    tonePair: [0, 1] as const,
  },
  {
    no: '02',
    title: '모임 찾고, 만들기',
    desc: '관심사로 모임을 둘러보거나, 마음에 드는 게 없으면 직접 만들어요.',
    tonePair: [3, 5] as const,
  },
  {
    no: '03',
    title: '이웃과 함께하기',
    desc: '채팅으로 약속을 잡고, 게시판에 일상을 나누며 가까워져요.',
    tonePair: [2, 4] as const,
  },
]

export function HowItWorksSection() {
  const { colors } = useTheme()
  const { tones } = useLandingPalette()

  const styles = React.useMemo(() => StyleSheet.create({
    section: {
      paddingVertical: spacing.sp10,
      paddingHorizontal: spacing.sp6,
    },
    steps: { gap: spacing.sp4 },
    step: {
      alignItems: 'flex-start',
      gap: spacing.sp3,
      padding: spacing.sp6,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.sm,
    },
    noBadge: { width: 44, height: 44 },
    noBadgeInner: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noText: {
      color: colors.onAccent,
      fontSize: fontSize.lg,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    stepTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
    stepDesc: { fontSize: fontSize.md, lineHeight: 24, color: colors.textSecondary },
  }), [colors])

  return (
    <View style={styles.section}>
      <Reveal>
        <SectionHead title="이렇게 시작해요" lead="세 단계면 동네 이웃과 이어집니다." />
      </Reveal>

      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <Reveal key={s.no} delay={i * 120}>
            <View style={styles.step}>
              <View
                style={{
                  shadowColor: tones[s.tonePair[0]],
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <GradientBox
                  stops={[tones[s.tonePair[0]], tones[s.tonePair[1]]]}
                  borderRadius={radius.full}
                  style={styles.noBadge}
                >
                  <View style={styles.noBadgeInner}>
                    <Text style={styles.noText}>{s.no}</Text>
                  </View>
                </GradientBox>
              </View>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          </Reveal>
        ))}
      </View>
    </View>
  )
}
