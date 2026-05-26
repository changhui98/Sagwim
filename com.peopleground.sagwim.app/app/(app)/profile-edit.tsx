import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { Stack, router } from 'expo-router'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../../src/context/AuthContext'
import { getMe, updateMyProfile, uploadUserProfileImage } from '../../src/api/userApi'
import { resolveImageUrl } from '../../src/lib/resolveImageUrl'
import { colors, fontSize, radius, spacing } from '../../src/constants/theme'
import type { UserDetailResponse } from '../../src/types/user'

function genderLabel(gender?: string): string {
  if (gender === 'MALE') return '남성'
  if (gender === 'FEMALE') return '여성'
  return '선택 안 함'
}

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets()
  const { setMeProfile } = useAuth()

  const [profile, setProfile] = useState<UserDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageUploading, setImageUploading] = useState(false)
  const [isSearchable, setIsSearchable] = useState(true)
  const [searchableLoading, setSearchableLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMe()
      .then((res) => {
        if (cancelled) return
        setProfile(res)
        setIsSearchable(res.isSearchable ?? true)
      })
      .catch(() => {
        if (!cancelled) Alert.alert('오류', '프로필을 불러오지 못했어요.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleImageChange = useCallback(async () => {
    if (!profile) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled) return

    const uri = result.assets[0].uri
    setImageUploading(true)
    try {
      const fileUrl = await uploadUserProfileImage(uri, profile.id)
      const updated = await updateMyProfile({
        nickname: profile.nickname,
        address: profile.address ?? '',
        currentPassword: '',
        newPassword: '',
        profileImageUrl: fileUrl,
        bio: profile.bio,
        gender: profile.gender,
        birthDate: profile.birthDate,
        isSearchable,
      })
      setProfile(updated)
      setMeProfile(updated)
    } catch {
      Alert.alert('오류', '사진 변경에 실패했습니다.')
    } finally {
      setImageUploading(false)
    }
  }, [profile, isSearchable, setMeProfile])

  const handleToggleSearchable = useCallback(async () => {
    if (!profile) return
    const next = !isSearchable
    setIsSearchable(next)
    setSearchableLoading(true)
    try {
      const updated = await updateMyProfile({
        nickname: profile.nickname,
        address: profile.address ?? '',
        currentPassword: '',
        newPassword: '',
        profileImageUrl: profile.profileImageUrl ?? null,
        bio: profile.bio,
        gender: profile.gender,
        birthDate: profile.birthDate,
        isSearchable: next,
      })
      setProfile(updated)
    } catch {
      setIsSearchable(!next)
      Alert.alert('오류', '설정 변경에 실패했습니다.')
    } finally {
      setSearchableLoading(false)
    }
  }, [profile, isSearchable])

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    )
  }

  if (!profile) return null

  const avatarUri = resolveImageUrl(profile.profileImageUrl)
  const initial = (profile.nickname ?? profile.username).charAt(0).toUpperCase()

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerSide}>
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>프로필 편집</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.sp8 }}>
          {/* 사진 섹션 */}
          <View style={styles.imageSection}>
            <View style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
              )}
              {imageUploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [styles.imageChangeBtn, pressed && styles.imageBtnPressed]}
              onPress={handleImageChange}
              disabled={imageUploading}
            >
              <Text style={styles.imageChangeBtnText}>사진 변경</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* 설정 목록 */}
          <View style={styles.settingList}>
            {/* 아이디 (read-only) */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>아이디</Text>
              <Text style={styles.settingValue}>{profile.username}</Text>
            </View>

            {/* 닉네임 */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.rowPressed]}
              onPress={() => router.push({ pathname: '/(app)/profile-edit-nickname', params: { profile: JSON.stringify(profile) } })}
            >
              <Text style={styles.settingLabel}>닉네임</Text>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{profile.nickname}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </Pressable>

            {/* 닉네임 검색 허용 */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>닉네임 검색 허용</Text>
              <Switch
                value={isSearchable}
                onValueChange={handleToggleSearchable}
                disabled={searchableLoading}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>

            {/* 성별 */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.rowPressed]}
              onPress={() => router.push({ pathname: '/(app)/profile-edit-gender', params: { profile: JSON.stringify(profile) } })}
            >
              <Text style={styles.settingLabel}>성별</Text>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{genderLabel(profile.gender)}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </Pressable>

            {/* 생년월일 */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.rowPressed]}
              onPress={() => router.push({ pathname: '/(app)/profile-edit-birthdate', params: { profile: JSON.stringify(profile) } })}
            >
              <Text style={styles.settingLabel}>생년월일</Text>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{profile.birthDate ?? '설정 안 됨'}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </Pressable>

            {/* 주소 */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.rowPressed]}
              onPress={() => router.push({ pathname: '/(app)/profile-edit-address', params: { profile: JSON.stringify(profile) } })}
            >
              <Text style={styles.settingLabel}>주소</Text>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue} numberOfLines={1}>{profile.address || '설정 안 됨'}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </Pressable>

            {/* 모임 노출 범위 */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>모임 노출 범위</Text>
              <Text style={styles.settingValue}>
                {profile.exposureRangeKm != null ? `${profile.exposureRangeKm}km` : '1km'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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

  imageSection: {
    alignItems: 'center',
    paddingVertical: spacing.sp6,
    gap: spacing.sp3,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: colors.accent },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageChangeBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp2,
  },
  imageBtnPressed: { backgroundColor: colors.surface2 },
  imageChangeBtnText: { fontSize: fontSize.sm, color: colors.text },

  divider: { height: 1, backgroundColor: colors.border },

  settingList: {},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.surface2 },
  settingLabel: { fontSize: fontSize.base, color: colors.text, fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sp1, flexShrink: 1, marginLeft: spacing.sp4 },
  settingValue: { fontSize: fontSize.base, color: colors.textMuted, flexShrink: 1 },
})
