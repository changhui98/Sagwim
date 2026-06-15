import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../../src/context/AuthContext'
import { updateMyProfile } from '../../src/api/userApi'
import { ConfirmDialog } from '../../src/components/common/ConfirmDialog'
import { AddressSearchInput } from '../../src/components/common/AddressSearchInput'
import { fontSize, radius, spacing } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'
import type { UserDetailResponse } from '../../src/types/user'

export default function ProfileEditAddressScreen() {
  const insets = useSafeAreaInsets()
  const { setMeProfile } = useAuth()
  const { colors } = useTheme()
  const { profile: profileJson } = useLocalSearchParams<{ profile: string }>()
  const profile: UserDetailResponse = JSON.parse(profileJson ?? '{}')

  const [selectedAddress, setSelectedAddress] = useState(profile.address ?? '')
  const [saving, setSaving] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)

  const isChanged = selectedAddress.trim() !== (profile.address ?? '').trim()
  const canSave = isChanged && selectedAddress.trim().length > 0

  const handleBack = useCallback(() => {
    if (isChanged) {
      setShowDiscard(true)
      return
    }
    router.back()
  }, [isChanged])

  const handleSave = useCallback(async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const updated = await updateMyProfile({
        nickname: profile.nickname,
        address: selectedAddress.trim(),
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
    } catch (err) {
      const message = err instanceof Error ? err.message : '주소 저장에 실패했습니다.'
      Alert.alert('오류', message)
    } finally {
      setSaving(false)
    }
  }, [canSave, selectedAddress, profile, setMeProfile])

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
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            style={styles.headerSide}
            disabled={saving}
          >
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>주소</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.body}>
          <AddressSearchInput
            value={selectedAddress}
            onChange={setSelectedAddress}
            disabled={saving}
            autoFocus
          />

          {/* 저장 버튼 */}
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

