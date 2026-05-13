import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { PrimaryButton } from '../PrimaryButton'
import { colors, fontSize, radius, spacing } from '../../constants/theme'

interface AddressOnboardingProps {
  onPressSetAddress: () => void
}

/**
 * 주소가 없는 사용자에게 표시되는 온보딩 카드.
 * 웹 GroupListPage 와 동일한 흐름 — 주소 설정 페이지로 보낸다.
 */
export function AddressOnboarding({ onPressSetAddress }: AddressOnboardingProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.emoji}>📍</Text>
        <Text style={styles.title}>동네를 알려주세요</Text>
        <Text style={styles.description}>
          내 근처의 모임을 보려면{'\n'}먼저 동네를 설정해 주세요.
        </Text>
        <PrimaryButton
          label="주소 설정하러 가기"
          onPress={onPressSetAddress}
          style={styles.button}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.sp5,
    paddingTop: spacing.sp10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sp8,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sp3,
  },
  title: {
    fontSize: fontSize.xl2,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sp3,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sp6,
  },
  button: {
    width: '100%',
  },
})
