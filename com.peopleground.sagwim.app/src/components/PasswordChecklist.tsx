/**
 * FE PasswordChecklist 컴포넌트 → RN 변환
 * StyleSheet.create 사용, CSS Modules 없음
 *
 * [성능]
 * React.memo로 감싸서 password/confirmPassword prop이 실제로 변경될 때만
 * re-render되도록 처리. 부모(sign-up.tsx)의 다른 state 변경으로 인한
 * 불필요한 re-render(regex 재실행)를 차단.
 */
import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { RULES } from '../utils/passwordRules'
import { spacing, fontSize } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

interface Props {
  password: string
  confirmPassword?: string
}

function PasswordChecklistComponent({ password, confirmPassword }: Props) {
  const { colors } = useTheme()
  const showConfirmRule = confirmPassword !== undefined && confirmPassword.length > 0
  const confirmMet = showConfirmRule && password === confirmPassword

  // regex 4개를 매 렌더마다 재실행하지 않도록 메모이제이션
  const ruleResults = useMemo(
    () => RULES.map(({ label, test }) => ({ label, met: test(password) })),
    [password],
  )

  const styles = useMemo(() => StyleSheet.create({
    root: { marginBottom: spacing.sp4, paddingHorizontal: spacing.sp1 },
    ruleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 22,
      marginBottom: spacing.sp1,
    },
    icon: {
      width: 16,
      fontSize: fontSize.sm,
      fontWeight: '700',
      marginRight: spacing.sp2,
      textAlign: 'center',
    },
    iconMet: { color: colors.success },
    iconUnmet: { color: colors.textMuted },
    ruleText: { fontSize: fontSize.sm },
    textMet: { color: colors.success },
    textUnmet: { color: colors.textMuted },
  }), [colors])

  return (
    <View style={styles.root}>
      {ruleResults.map(({ label, met }) => (
        <View key={label} style={styles.ruleRow}>
          <Text style={[styles.icon, met ? styles.iconMet : styles.iconUnmet]}>
            {met ? '✓' : '·'}
          </Text>
          <Text style={[styles.ruleText, met ? styles.textMet : styles.textUnmet]}>
            {label}
          </Text>
        </View>
      ))}

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

export const PasswordChecklist = React.memo(PasswordChecklistComponent)

