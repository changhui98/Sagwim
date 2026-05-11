/**
 * FE PasswordChecklist 컴포넌트 → RN 변환
 * StyleSheet.create 사용, CSS Modules 없음
 */
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { RULES } from '../utils/passwordRules'
import { colors, spacing, fontSize } from '../constants/theme'

interface Props {
  password: string
  confirmPassword?: string
}

export function PasswordChecklist({ password, confirmPassword }: Props) {
  if (password.length === 0) return null

  const showConfirmRule = confirmPassword !== undefined && confirmPassword.length > 0
  const confirmMet = showConfirmRule && password === confirmPassword

  return (
    <View style={styles.root} accessibilityLiveRegion="polite">
      {RULES.map(({ label, test }) => {
        const met = test(password)
        return (
          <View key={label} style={styles.ruleRow}>
            <Text style={[styles.icon, met ? styles.iconMet : styles.iconUnmet]}>
              {met ? '✓' : '·'}
            </Text>
            <Text style={[styles.ruleText, met ? styles.textMet : styles.textUnmet]}>
              {label}
            </Text>
          </View>
        )
      })}

      {showConfirmRule && (
        <View style={styles.ruleRow}>
          <Text style={[styles.icon, confirmMet ? styles.iconMet : styles.iconUnmet]}>
            {confirmMet ? '✓' : '·'}
          </Text>
          <Text style={[styles.ruleText, confirmMet ? styles.textMet : styles.textUnmet]}>
            비밀번호 일치
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.sp4,
    paddingHorizontal: spacing.sp1,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sp1,
  },
  icon: {
    width: 16,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginRight: spacing.sp2,
    textAlign: 'center',
  },
  iconMet: {
    color: colors.success,
  },
  iconUnmet: {
    color: colors.textMuted,
  },
  ruleText: {
    fontSize: fontSize.sm,
  },
  textMet: {
    color: colors.success,
  },
  textUnmet: {
    color: colors.textMuted,
  },
})
