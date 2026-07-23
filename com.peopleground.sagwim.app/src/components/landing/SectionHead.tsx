/**
 * SectionHead — 랜딩 섹션 공통 헤더 (타이틀 + 듀오 그라데이션 titleBar + 리드).
 * FE 각 섹션 모듈의 .head/.title/.titleBar/.lead 패턴 대체.
 */

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { fontSize, radius, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { GradientBox } from './GradientBox'

interface SectionHeadProps {
  title: string
  lead?: string
}

export function SectionHead({ title, lead }: SectionHeadProps) {
  const { colors } = useTheme()

  const styles = React.useMemo(() => StyleSheet.create({
    head: { alignItems: 'center', marginBottom: spacing.sp10 },
    title: {
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.7,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.sp3,
    },
    titleBar: { width: 40, height: 4, marginBottom: spacing.sp3 },
    lead: {
      maxWidth: 540,
      fontSize: fontSize.md,
      lineHeight: 25,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }), [colors])

  return (
    <View style={styles.head}>
      <Text style={styles.title}>{title}</Text>
      <GradientBox stops={colors.duoGradient} borderRadius={radius.full} style={styles.titleBar} />
      {lead ? <Text style={styles.lead}>{lead}</Text> : null}
    </View>
  )
}
