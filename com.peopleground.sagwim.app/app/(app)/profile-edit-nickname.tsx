import React, { useCallback, useMemo, useState } from 'react'
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
import { checkNickname } from '../../src/api/authApi'
import { ConfirmDialog } from '../../src/components/common/ConfirmDialog'
import { fontSize, radius, spacing } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'
import type { UserDetailResponse } from '../../src/types/user'

export default function ProfileEditNicknameScreen() {
  const insets = useSafeAreaInsets()
  const { setMeProfile } = useAuth()
  const { colors } = useTheme()
  const { profile: profileJson } = useLocalSearchParams<{ profile: string }>()
  const profile: UserDetailResponse = JSON.parse(profileJson ?? '{}')

  const [nickname, setNickname] = useState(profile.nickname ?? '')
  const [checked, setChecked] = useState(false)
  const [available, setAvailable] = useState(false)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)

  const isChanged = nickname.trim() !== (profile.nickname ?? '').trim()
  const canSave = isChanged && checked && available

  const handleBack = useCallback(() => {
    if (isChanged) {
      setShowDiscard(true)
      return
    }
    router.back()
  }, [isChanged])

  const handleCheckNickname = useCallback(async () => {
    const trimmed = nickname.trim()
    if (!trimmed) return
    setChecking(true)
    try {
      const isAvailable = await checkNickname(trimmed)
      setChecked(true)
      setAvailable(isAvailable)
      Alert.alert(
        isAvailable ? '사용 가능' : '사용 불가',
        isAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.',
      )
    } catch {
      Alert.alert('오류', '중복 확인 중 오류가 발생했습니다.')
    } finally {
      setChecking(false)
    }
  }, [nickname])

  const handleSave = useCallback(async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const updated = await updateMyProfile({
        nickname: nickname.trim(),
        address: profile.address ?? '',
        currentPassword: '',
        newPassword: '',
        profileImageUrl: profile.profileImageUrl ?? null,
        bio: profile.bio,
        gender: profile.gender,
        birthDate: profile.birthDate,
        isSearchable: profile.isSearchable,
      })
      setMeProfile(updated)
      router.back()
    } catch {
      Alert.alert('오류', '닉네임 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }, [canSave, nickname, profile, setMeProfile])

  const styles = useMemo(() => StyleSheet.create({
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
    inputRow: { flexDirection: 'row', gap: spacing.sp2, alignItems: 'center' },
    input: {
      flex: 1,
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sp3,
      fontSize: fontSize.base,
      color: colors.text,
      backgroundColor: colors.bg,
    },
    checkBtn: {
      height: 44,
      paddingHorizontal: spacing.sp3,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 72,
    },
    checkBtnDisabled: { opacity: 0.4 },
    checkBtnPressed: { backgroundColor: colors.surface2 },
    checkBtnText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
    hint: { fontSize: fontSize.xs, color: colors.textMuted },
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
  }), [colors])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={8} style={styles.headerSide} disabled={saving}>
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>닉네임</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.body}>
          <Text style={styles.label}>닉네임</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={(v) => { setNickname(v); setChecked(false); setAvailable(false) }}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor={colors.textMuted}
              editable={!saving}
              autoFocus
            />
            <Pressable
              style={({ pressed }) => [
                styles.checkBtn,
                (!isChanged || !nickname.trim() || saving) && styles.checkBtnDisabled,
                pressed && styles.checkBtnPressed,
              ]}
              onPress={handleCheckNickname}
              disabled={!isChanged || !nickname.trim() || saving || checking}
            >
              {checking
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <Text style={styles.checkBtnText}>중복확인</Text>
              }
            </Pressable>
          </View>

          {isChanged && !checked && nickname.trim().length > 0 && (
            <Text style={styles.hint}>닉네임을 변경하려면 중복 확인이 필요합니다.</Text>
          )}

          <Text style={styles.notice}>닉네임은 7일 동안 최대 두 번까지 변경할 수 있습니다.</Text>

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

