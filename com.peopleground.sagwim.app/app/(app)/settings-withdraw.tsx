import React, { useCallback, useMemo, useState } from 'react'
import {
  Alert,
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
import { deleteMyAccount } from '../../src/api/userApi'
import { useAuth } from '../../src/context/AuthContext'
import { fontSize, radius, spacing } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'

const NOTICES = [
  '가입된 모든 모임에서 자동으로 탈퇴돼요. 다시 가입하려면 모임 가입 절차를 처음부터 다시 거쳐야 해요.',
  '내가 작성한 개인 게시글은 모두 삭제돼요. 삭제된 게시글은 복구할 수 없으니 탈퇴 전에 꼭 확인해 주세요.',
  '모임 안에서 작성한 게시글과 다른 회원의 게시글·모임에 남긴 댓글은 삭제되지 않아요. 정리가 필요하면 탈퇴 전에 직접 삭제해 주세요.',
  '탈퇴 신청 후 3일 동안은 삭제 대기 상태로 보관돼요. 이 기간 안에 다시 로그인해서 "계정 복구"를 누르면 그대로 다시 이용할 수 있어요. 3일이 지나면 탈퇴가 확정되어 복구할 수 없어요.',
  '탈퇴가 확정된 후에는 7일 동안 같은 이메일로 다시 가입할 수 없어요.',
] as const

const AGREEMENT_LABEL = '회원 탈퇴 유의사항을 모두 확인하였으며 이에 동의합니다.'

export default function SettingsWithdrawScreen() {
  const insets = useSafeAreaInsets()
  const { meNickname, logout } = useAuth()
  const { colors } = useTheme()

  const [checked, setChecked] = useState<boolean[]>(() => NOTICES.map(() => false))
  const [agreed, setAgreed] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleNotice = useCallback((index: number) => {
    setChecked((prev) => {
      const next = [...prev]
      const willBe = !next[index]
      next[index] = willBe
      if (!willBe) {
        for (let i = index + 1; i < next.length; i++) next[i] = false
        setAgreed(false)
      }
      return next
    })
  }, [])

  const allNoticesChecked = useMemo(() => checked.every(Boolean), [checked])
  const canSubmit = allNoticesChecked && agreed && !isSubmitting

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      await deleteMyAccount(reason)
      await logout()
      router.replace('/(auth)/login')
    } catch {
      Alert.alert('오류', '탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setIsSubmitting(false)
    }
  }, [canSubmit, reason, logout])

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
      gap: spacing.sp6,
    },
    message: {
      fontSize: fontSize.xl2,
      fontWeight: '700',
      color: colors.text,
      lineHeight: fontSize.xl2 * 1.4,
    },
    checkList: {
      gap: spacing.sp4,
    },
    checkItem: {
      flexDirection: 'row',
      gap: spacing.sp3,
      alignItems: 'flex-start',
    },
    agreementItem: {
      paddingTop: spacing.sp2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.sp2,
    },
    checkText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: colors.text,
      lineHeight: fontSize.sm * 1.6,
    },
    reasonSection: { gap: spacing.sp2 },
    reasonLabel: {
      fontSize: fontSize.base,
      fontWeight: '600',
      color: colors.text,
    },
    reasonInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sp3,
      fontSize: fontSize.base,
      color: colors.text,
      minHeight: 120,
    },
    submitBtn: {
      backgroundColor: colors.error,
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.headerSide} onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>회원탈퇴</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.sp8 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.message}>
            {meNickname ? `${meNickname}님` : ''}
            {'\n'}정말 탈퇴하시겠어요?
          </Text>

          <View style={styles.checkList}>
            {NOTICES.map((text, index) => {
              const visible = index === 0 || checked[index - 1]
              if (!visible) return null
              return (
                <Pressable
                  key={index}
                  style={styles.checkItem}
                  onPress={() => toggleNotice(index)}
                >
                  <Ionicons
                    name={checked[index] ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={checked[index] ? colors.accent : colors.border}
                  />
                  <Text style={styles.checkText}>{text}</Text>
                </Pressable>
              )
            })}

            {allNoticesChecked && (
              <Pressable
                style={[styles.checkItem, styles.agreementItem]}
                onPress={() => setAgreed((v) => !v)}
              >
                <Ionicons
                  name={agreed ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={agreed ? colors.accent : colors.border}
                />
                <Text style={styles.checkText}>{AGREEMENT_LABEL}</Text>
              </Pressable>
            )}
          </View>

          {allNoticesChecked && (
            <View style={styles.reasonSection}>
              <Text style={styles.reasonLabel}>떠나시는 이유를 알려주세요.</Text>
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder={
                  '서비스 탈퇴 사유에 대해 알려주세요.\n고객님의 소중한 피드백을 담아\n더 나은 서비스로 보답 드리도록 하겠습니다.'
                }
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
            </View>
          )}

          <Pressable
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? '탈퇴 처리 중…' : '회원 탈퇴'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </>
  )
}

