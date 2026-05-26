import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fontSize, radius, spacing } from '../../constants/theme'

export interface ActionSheetOption {
  label: string
  onPress: () => void
  variant?: 'default' | 'destructive'
}

interface Props {
  isOpen: boolean
  options: ActionSheetOption[]
  onClose: () => void
}

export function ActionSheet({ isOpen, options, onClose }: Props) {
  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {options.map((opt, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.option,
                i < options.length - 1 && styles.optionBorder,
                pressed && styles.optionPressed,
              ]}
              onPress={() => { onClose(); opt.onPress() }}
            >
              <Text style={[styles.optionText, opt.variant === 'destructive' && styles.destructiveText]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}

          <View style={styles.gap} />

          <Pressable
            style={({ pressed }) => [styles.cancelOption, pressed && styles.optionPressed]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface2,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.sp4,
    paddingTop: spacing.sp3,
    paddingBottom: spacing.sp8,
    gap: 0,
  },
  option: {
    backgroundColor: colors.bg,
    paddingVertical: spacing.sp4,
    alignItems: 'center',
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionPressed: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: fontSize.lg,
    color: colors.text,
  },
  destructiveText: {
    color: colors.error,
  },
  gap: {
    height: spacing.sp2,
  },
  cancelOption: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingVertical: spacing.sp4,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
})
