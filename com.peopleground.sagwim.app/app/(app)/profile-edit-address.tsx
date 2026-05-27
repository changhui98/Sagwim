import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../../src/context/AuthContext'
import { updateMyProfile } from '../../src/api/userApi'
import apiClient from '../../src/lib/apiClient'
import { ConfirmDialog } from '../../src/components/common/ConfirmDialog'
import { fontSize, radius, spacing } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'
import type { UserDetailResponse } from '../../src/types/user'

async function searchAddress(query: string): Promise<string[]> {
  try {
    const response = await apiClient.get<{ suggestions: string[] }>('/address/search', {
      params: { query },
    })
    return response.data.suggestions ?? []
  } catch {
    return []
  }
}

export default function ProfileEditAddressScreen() {
  const insets = useSafeAreaInsets()
  const { setMeProfile } = useAuth()
  const { colors } = useTheme()
  const { profile: profileJson } = useLocalSearchParams<{ profile: string }>()
  const profile: UserDetailResponse = JSON.parse(profileJson ?? '{}')

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(profile.address ?? '')
  const [saving, setSaving] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isChanged = selectedAddress.trim() !== (profile.address ?? '').trim()
  const canSave = isChanged && selectedAddress.trim().length > 0

  const handleBack = useCallback(() => {
    if (isChanged) {
      setShowDiscard(true)
      return
    }
    router.back()
  }, [isChanged])

  // 검색어 변경 시 debounce 검색
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      return
    }
    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true)
      const results = await searchAddress(trimmed)
      setSuggestions(results)
      setIsSearching(false)
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query])

  const handleSelectSuggestion = useCallback((addr: string) => {
    setSelectedAddress(addr)
    setQuery('')
    setSuggestions([])
  }, [])

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
    selectedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sp2,
      paddingVertical: spacing.sp3,
      paddingHorizontal: spacing.sp3,
      borderRadius: radius.md,
      backgroundColor: colors.surface2,
    },
    selectedText: {
      flex: 1,
      fontSize: fontSize.base,
      color: colors.text,
      fontWeight: '500',
    },
    label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    input: {
      flex: 1,
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sp3,
      paddingRight: spacing.sp8,
      fontSize: fontSize.base,
      color: colors.text,
      backgroundColor: colors.bg,
    },
    searchIndicator: {
      position: 'absolute',
      right: spacing.sp3,
    },
    hint: { fontSize: fontSize.sm, color: colors.textMuted },
    suggestionList: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.bg,
    },
    suggestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowPressed: { backgroundColor: colors.surface2 },
    suggestionRowSelected: {},
    suggestionText: { fontSize: fontSize.base, color: colors.text, flex: 1 },
    suggestionTextSelected: { color: colors.accent, fontWeight: '600' },
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
          {/* 현재 선택된 주소 */}
          {selectedAddress.trim().length > 0 && (
            <View style={styles.selectedRow}>
              <Ionicons name="location" size={16} color={colors.accent} />
              <Text style={styles.selectedText} numberOfLines={1}>
                {selectedAddress}
              </Text>
            </View>
          )}

          {/* 검색 입력 */}
          <Text style={styles.label}>주소 검색</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="동명(읍, 면)으로 검색 (예: 서초동)"
              placeholderTextColor={colors.textMuted}
              editable={!saving}
              autoFocus
              returnKeyType="search"
            />
            {isSearching && (
              <ActivityIndicator
                size="small"
                color={colors.accent}
                style={styles.searchIndicator}
              />
            )}
          </View>

          <Text style={styles.hint}>동·읍·면 단위까지만 입력해 주세요.</Text>
          <Text style={styles.hint}>주소는 모임 추천 등에 활용됩니다.</Text>

          {/* 검색 결과 목록 */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionList}>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.suggestionRow,
                      pressed && styles.rowPressed,
                      item === selectedAddress && styles.suggestionRowSelected,
                    ]}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Text
                      style={[
                        styles.suggestionText,
                        item === selectedAddress && styles.suggestionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {item === selectedAddress && (
                      <Ionicons name="checkmark" size={16} color={colors.accent} />
                    )}
                  </Pressable>
                )}
              />
            </View>
          )}

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

