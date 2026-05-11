import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from 'react-native'
import { colors, radius, fontSize } from '../constants/theme'

interface Props extends TouchableOpacityProps {
  label: string
  loading?: boolean
}

export function SecondaryButton({ label, loading, disabled, style, ...rest }: Props) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      style={[styles.btn, isDisabled && styles.btnDisabled, style]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} size="small" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
})
