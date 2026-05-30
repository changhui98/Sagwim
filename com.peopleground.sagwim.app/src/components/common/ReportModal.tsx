import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { fontSize, radius, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { createReport, type ReportTargetType } from '../../api/reportApi'

const MAX_REASON_LENGTH = 500

const TARGET_TYPE_LABEL: Record<ReportTargetType, string> = {
  POST: '게시글',
  COMMENT: '댓글',
}

interface Props {
  isOpen: boolean
  targetType: ReportTargetType
  targetId: number | null
  onClose: () => void
  onSuccess?: () => void
}

export function ReportModal({ isOpen, targetType, targetId, onClose, onSuccess }: Props) {
  const { colors } = useTheme()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setErrorMsg(null)
      setSubmitting(false)
    }
  }, [isOpen])

  const typeLabel = TARGET_TYPE_LABEL[targetType] ?? targetType
  const isOverLimit = reason.length > MAX_REASON_LENGTH
  const canSubmit = reason.trim().length > 0 && !isOverLimit && !submitting

  const handleSubmit = async () => {
    if (targetId == null) return
    if (!reason.trim()) {
      setErrorMsg('신고 사유를 입력해주세요.')
      return
    }
    if (isOverLimit) {
      setErrorMsg(`신고 사유는 ${MAX_REASON_LENGTH}자 이하로 입력해주세요.`)
      return
    }
    setSubmitting(true)
    setErrorMsg(null)
    try {
      await createReport(targetType, targetId, reason.trim())
      Alert.alert('신고 완료', '신고가 접수되었습니다. 검토 후 조치하겠습니다.')
      onSuccess?.()
      onClose()
    } catch {
      setErrorMsg('신고 처리 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const styles = useMemo(() => StyleSheet.create({
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
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.sp3,
    },
    fieldLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sp2,
    },
    required: { color: colors.error },
    textarea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface2,
      paddingHorizontal: spacing.sp3,
      paddingVertical: spacing.sp3,
      fontSize: fontSize.base,
      color: colors.text,
      minHeight: 120,
      maxHeight: 220,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'right',
      marginTop: spacing.sp1,
    },
    charCountWarn: { color: colors.error },
    errorMsg: {
      fontSize: fontSize.sm,
      color: colors.error,
      marginTop: spacing.sp2,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sp2,
      marginTop: spacing.sp4,
    },
    btn: {
      flex: 1,
      height: 46,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtn: { backgroundColor: colors.surface3 },
    cancelBtnText: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
    submitBtn: { backgroundColor: colors.errorSoft },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: { fontSize: fontSize.base, fontWeight: '700', color: colors.error },
    btnPressed: { opacity: 0.8 },
  }), [colors])

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>{typeLabel}을 신고합니다</Text>
            <Text style={styles.subtitle}>
              {typeLabel}에 대한 신고 사유를 작성해주세요.{'\n'}
              허위 신고 시 이용이 제한될 수 있습니다.
            </Text>

            <Text style={styles.fieldLabel}>
              신고 사유 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textarea}
              placeholder="신고 사유를 자세히 작성해주세요."
              placeholderTextColor={colors.textMuted}
              value={reason}
              onChangeText={(text) => {
                setReason(text)
                if (errorMsg) setErrorMsg(null)
              }}
              multiline
              maxLength={MAX_REASON_LENGTH + 10}
              autoFocus
            />
            <Text style={[styles.charCount, isOverLimit && styles.charCountWarn]}>
              {reason.length} / {MAX_REASON_LENGTH}
            </Text>

            {errorMsg && <Text style={styles.errorMsg}>{errorMsg}</Text>}

            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.cancelBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={onClose}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.submitBtn,
                  !canSubmit && styles.submitBtnDisabled,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => void handleSubmit()}
                disabled={!canSubmit}
              >
                {submitting
                  ? <ActivityIndicator size="small" color={colors.error} />
                  : <Text style={styles.submitBtnText}>신고하기</Text>
                }
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}
