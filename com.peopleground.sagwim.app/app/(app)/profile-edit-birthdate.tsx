import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../../src/context/AuthContext'
import { updateMyProfile } from '../../src/api/userApi'
import { ConfirmDialog } from '../../src/components/common/ConfirmDialog'
import { colors, fontSize, radius, spacing } from '../../src/constants/theme'
import type { UserDetailResponse } from '../../src/types/user'

/** YYYY-MM-DD 형식 검증 */
function isValidDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const [y, m, d] = str.split('-').map(Number)
  if (m < 1 || m > 12) return false
  const daysInMonth = new Date(y, m, 0).getDate()
  if (d < 1 || d > daysInMonth) return false
  const now = new Date()
  const date = new Date(str)
  if (date > now) return false
  if (y < 1900) return false
  return true
}

/** 숫자 입력을 자동으로 YYYY-MM-DD 형식으로 변환 */
function formatBirthDateInput(prev: string, next: string): string {
  // 숫자만 추출
  const digits = next.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

export default function ProfileEditBirthDateScreen() {
  const insets = useSafeAreaInsets()
  const { setMeProfile } = useAuth()
  const { profile: profileJson } = useLocalSearchParams<{ profile: string }>()
  const profile: UserDetailResponse = JSON.parse(profileJson ?? '{}')

  const [birthDate, setBirthDate] = useState(profile.birthDate ?? '')
  const [saving, setSaving] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)

  const isChanged = birthDate.trim() !== (profile.birthDate ?? '').trim()
  const isValid = isValidDate(birthDate.trim())
  const canSave = isChanged && isValid

  const handleBack = useCallback(() => {
    if (isChanged) {
      setShowDiscard(true)
      return
    }
    router.back()
  }, [isChanged])

  const handleChangeText = useCallback((text: string) => {
    setBirthDate((prev) => formatBirthDateInput(prev, text))
  }, [])

  const handleSave = useCallback(async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const updated = await updateMyProfile({
        nickname: profile.nickname,
        address: profile.address ?? '',
        currentPassword: '',
        newPassword: '',
        profileImageUrl: profile.profileImageUrl ?? null,
        bio: profile.bio,
        gender: profile.gender,
        birthDate: birthDate.trim(),
        isSearchable: profile.isSearchable,
      })
      setMeProfile(updated)
      router.back()
    } catch (err) {
      const message = err instanceof Error ? err.message : '생년월일 저장에 실패했습니다.'
      Alert.alert('오류', message)
    } finally {
      setSaving(false)
    }
  }, [canSave, birthDate, profile, setMeProfile])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            style={styles.headerSide}
            disabled={saving}
          >
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>생년월일</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.body}>
          <Text style={styles.label}>생년월일</Text>

          <TextInput
            style={[
              styles.input,
              birthDate.length > 0 && !isValid && styles.inputError,
            ]}
            value={birthDate}
            onChangeText={handleChangeText}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            editable={!saving}
            autoFocus
          />

          <Text style={styles.notice}>
            생년월일은 신중하게 입력해 주세요.
          </Text>

          {birthDate.length > 0 && !isValid && (
            <Text style={styles.errorText}>
              올바른 날짜를 입력해 주세요. (예: 1995-03-15)
            </Text>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              pressed && canSave && styles.saveBtnPressed,
            ]}
            onPress={handleSave}
            disabled={!canSave || saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>저장</Text>
            }
          </Pressable>
        </View>
      </View>

      <ConfirmDialog
        isOpen={showDiscard}
        title="변경 취소"
        message="변경 사항이 사라집니다. 계속하시겠습니까?"
        confirmLabel="나가기"
        cancelLabel="계속 편집"
        confirmVariant="danger"
        onConfirm={() => { setShowDiscard(false); router.back() }}
        onCancel={() => setShowDiscard(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSide: { width: 72 },
  headerBack: { fontSize: fontSize.sm, color: colors.text },
  headerTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },

  body: { padding: spacing.sp4, gap: spacing.sp3 },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sp3,
    fontSize: fontSize.base,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: fontSize.xs,
    color: '#ef4444',
  },
  notice: { fontSize: fontSize.sm, color: colors.textMuted },

  saveBtn: {
    marginTop: spacing.sp2,
    height: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { backgroundColor: colors.border },
  saveBtnPressed: { opacity: 0.85 },
  saveBtnText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
})
