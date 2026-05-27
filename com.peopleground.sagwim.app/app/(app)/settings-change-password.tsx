import React, { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Stack, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { updateMyProfile } from '../../src/api/userApi'
import { fontSize, radius, spacing } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'

const RULES = [
  { label: '8자 이상', test: (pw: string) => pw.length >= 8 },
  { label: '소문자 포함', test: (pw: string) => /[a-z]/.test(pw) },
  { label: '대문자 포함', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: '특수문자 포함', test: (pw: string) => /[!@#$%^&*()_+\-={}\[\]:;"'<>,.?/]/.test(pw) },
]

function isPasswordValid(pw: string) {
  return RULES.every(({ test }) => test(pw))
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [secure, setSecure] = useState(true)
  const { colors } = useTheme()
  const fieldStyles = useMemo(() => StyleSheet.create({
    fieldGroup: { gap: spacing.sp2 },
    label: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      paddingHorizontal: spacing.sp4,
      backgroundColor: colors.bg,
    },
    input: {
      flex: 1,
      paddingVertical: spacing.sp3,
      fontSize: fontSize.base,
      color: colors.text,
    },
    eyeBtn: { padding: 4 },
  }), [colors])
  return (
    <View style={fieldStyles.fieldGroup}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.inputWrap}>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secure}
          autoCapitalize="none"
        />
        <Pressable onPress={() => setSecure((s) => !s)} hitSlop={8} style={fieldStyles.eyeBtn}>
          <Ionicons
            name={secure ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  )
}

export default function SettingsChangePasswordScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = useMemo(
    () =>
      currentPassword.length > 0 &&
      isPasswordValid(newPassword) &&
      confirmPassword.length > 0 &&
      newPassword === confirmPassword &&
      !isSubmitting,
    [currentPassword, newPassword, confirmPassword, isSubmitting],
  )

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      await updateMyProfile({
        nickname: '',
        address: '',
        currentPassword,
        newPassword,
      })
      Alert.alert('완료', '비밀번호가 변경되었어요.', [
        { text: '확인', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('오류', '비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }, [canSubmit, currentPassword, newPassword])

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerSide: { width: 72 },
    headerBack: { fontSize: fontSize.base, color: colors.text },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    body: {
      padding: spacing.sp4,
      gap: spacing.sp4,
    },
    rules: { gap: spacing.sp1, marginTop: -spacing.sp2 },
    ruleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sp1 },
    ruleText: { fontSize: fontSize.xs, color: colors.textMuted },
    ruleTextOk: { color: colors.accent },
    mismatchText: {
      fontSize: fontSize.xs,
      color: colors.error,
      marginTop: -spacing.sp2,
    },
    submitBtn: {
      marginTop: spacing.sp2,
      backgroundColor: colors.accent,
      borderRadius: radius.xl,
      paddingVertical: spacing.sp4,
      alignItems: 'center',
    },
    submitBtnDisabled: { backgroundColor: colors.accentMuted },
    submitBtnText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  }), [colors])

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Pressable style={styles.headerSide} onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.headerBack}>돌아가기</Text>
            </Pressable>
            <Text style={styles.headerTitle}>비밀번호 변경</Text>
            <View style={styles.headerSide} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.sp8 }]}
            keyboardShouldPersistTaps="handled"
          >
            <PasswordField
              label="현재 비밀번호"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="현재 비밀번호를 입력하세요"
            />

            <PasswordField
              label="새 비밀번호"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="새 비밀번호를 입력하세요"
            />

            {newPassword.length > 0 && (
              <View style={styles.rules}>
                {RULES.map((rule) => {
                  const ok = rule.test(newPassword)
                  return (
                    <View key={rule.label} style={styles.ruleRow}>
                      <Ionicons
                        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={ok ? colors.accent : colors.textMuted}
                      />
                      <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>
                        {rule.label}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )}

            <PasswordField
              label="새 비밀번호 확인"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="새 비밀번호를 다시 입력하세요"
            />

            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={styles.mismatchText}>비밀번호가 일치하지 않아요.</Text>
            )}

            <Pressable
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={() => void handleSubmit()}
              disabled={!canSubmit}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? '변경 중…' : '비밀번호 변경'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  )
}

