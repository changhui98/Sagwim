import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from 'react-native'
import { colors, radius, spacing, fontSize } from '../constants/theme'

interface Props extends TouchableOpacityProps {
  label: string
  loading?: boolean
}

export function PrimaryButton({ label, loading, disabled, style, ...rest }: Props) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      style={[styles.btn, isDisabled && styles.btnDisabled, style]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  label: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
})
