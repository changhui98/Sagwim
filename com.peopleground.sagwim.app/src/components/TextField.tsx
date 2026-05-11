import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native'
import { colors, radius, spacing, fontSize } from '../constants/theme'

interface Props extends TextInputProps {
  label?: string
  error?: string
  /** true면 눈 아이콘 토글 표시 (비밀번호 입력) */
  isPassword?: boolean
  /** 유효성 상태 테두리 피드백 (success | error | undefined) */
  validationState?: 'success' | 'error'
}

export function TextField({
  label,
  error,
  isPassword,
  validationState,
  style,
  editable = true,
  ...rest
}: Props) {
  const [showPassword, setShowPassword] = useState(false)

  const borderColor =
    validationState === 'success'
      ? colors.success
      : validationState === 'error'
        ? colors.error
        : colors.borderStrong

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputRow,
          { borderColor },
          !editable && styles.inputDisabled,
          validationState === 'success' && styles.focusSuccess,
          validationState === 'error' && styles.focusError,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          editable={editable}
          autoCorrect={false}
          spellCheck={false}
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.eyeText}>{showPassword ? '숨기기' : '보기'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sp4,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sp2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 48,
    paddingHorizontal: spacing.sp3,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.sp3,
  },
  inputDisabled: {
    backgroundColor: colors.surface3,
    opacity: 0.7,
  },
  eyeBtn: {
    paddingLeft: spacing.sp2,
  },
  eyeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.sp1,
  },
  focusSuccess: {
    // 안드로이드 elevation 없이 iOS shadow만
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  focusError: {
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
})
