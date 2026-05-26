import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fontSize, radius, spacing } from '../../constants/theme'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  confirmVariant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && styles.cancelBtnPressed]}
              onPress={onCancel}
            >
              <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                confirmVariant === 'danger' ? styles.dangerBtn : styles.primaryBtn,
                pressed && styles.confirmBtnPressed,
              ]}
              onPress={onConfirm}
            >
              <Text style={[
                styles.confirmBtnText,
                confirmVariant === 'danger' ? styles.dangerBtnText : styles.primaryBtnText,
              ]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sp6,
  },
  card: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sp6,
    paddingTop: spacing.sp6,
    paddingBottom: spacing.sp5,
    gap: spacing.sp2,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sp1,
  },
  message: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sp3,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sp2,
    marginTop: spacing.sp1,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.surface3,
  },
  cancelBtnPressed: {
    opacity: 0.7,
  },
  cancelBtnText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
  },
  dangerBtn: {
    backgroundColor: colors.errorSoft,
  },
  confirmBtnPressed: {
    opacity: 0.8,
  },
  primaryBtnText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: '#fff',
  },
  dangerBtnText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.error,
  },
})
