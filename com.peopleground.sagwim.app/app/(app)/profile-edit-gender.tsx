import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../../src/context/AuthContext'
import { updateMyProfile } from '../../src/api/userApi'
import { colors, fontSize, radius, spacing } from '../../src/constants/theme'
import type { Gender, UserDetailResponse } from '../../src/types/user'

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
  { value: 'NONE', label: '선택 안 함' },
]

export default function ProfileEditGenderScreen() {
  const insets = useSafeAreaInsets()
  const { setMeProfile } = useAuth()
  const { profile: profileJson } = useLocalSearchParams<{ profile: string }>()
  const profile: UserDetailResponse = JSON.parse(profileJson ?? '{}')

  const [selected, setSelected] = useState<Gender>(profile.gender ?? 'NONE')
  const [saving, setSaving] = useState(false)

  const handleSelectGender = async (value: Gender) => {
    if (saving) return
    setSelected(value)

    const hasChange = value !== (profile.gender ?? 'NONE')
    if (!hasChange) {
      router.back()
      return
    }

    setSaving(true)
    try {
      const updated = await updateMyProfile({
        nickname: profile.nickname,
        address: profile.address ?? '',
        currentPassword: '',
        newPassword: '',
        profileImageUrl: profile.profileImageUrl ?? null,
        bio: profile.bio,
        gender: value,
        birthDate: profile.birthDate,
        isSearchable: profile.isSearchable,
      })
      setMeProfile(updated)
      router.back()
    } catch (err) {
      const message = err instanceof Error ? err.message : '성별 저장에 실패했습니다.'
      Alert.alert('오류', message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable
            onPress={() => { if (!saving) router.back() }}
            hitSlop={8}
            style={styles.headerSide}
            disabled={saving}
          >
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>성별</Text>
          <View style={styles.headerSide} />
        </View>

        {/* 성별 선택 목록 */}
        <View style={styles.optionList}>
          {GENDER_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.optionRow,
                pressed && !saving && styles.rowPressed,
              ]}
              onPress={() => handleSelectGender(option.value)}
              disabled={saving}
            >
              <Text style={styles.optionLabel}>{option.label}</Text>
              {selected === option.value && (
                saving
                  ? <ActivityIndicator size="small" color={colors.accent} />
                  : <Ionicons name="checkmark" size={20} color={colors.accent} />
              )}
            </Pressable>
          ))}
        </View>
      </View>
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

  optionList: {},
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.surface2 },
  optionLabel: { fontSize: fontSize.base, color: colors.text },
})
