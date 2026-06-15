import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import apiClient from '../../lib/apiClient'
import { fontSize, radius, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

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

interface AddressSearchInputProps {
  /** 현재 선택된 주소 */
  value: string
  /** 주소 선택 시 호출 */
  onChange: (address: string) => void
  /** 검색 입력 비활성화 (저장 중 등) */
  disabled?: boolean
  autoFocus?: boolean
  /** 검색창 하단 안내 문구 (기본: 동·읍·면 안내) */
  hints?: string[]
}

const DEFAULT_HINTS = [
  '동·읍·면 단위까지만 입력해 주세요.',
  '주소는 모임 추천 등에 활용됩니다.',
]

/**
 * 동·읍·면 단위 주소 검색 + 자동완성 입력 컴포넌트.
 * 선택된 주소 표시, 검색 입력(디바운스), 결과 목록을 제공한다.
 * 저장 버튼/헤더는 사용하는 화면이 직접 소유한다.
 */
export function AddressSearchInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  hints = DEFAULT_HINTS,
}: AddressSearchInputProps) {
  const { colors } = useTheme()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const handleSelectSuggestion = (addr: string) => {
    onChange(addr)
    setQuery('')
    setSuggestions([])
  }

  const styles = useMemo(() => StyleSheet.create({
    container: { gap: spacing.sp3 },
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
    suggestionText: { fontSize: fontSize.base, color: colors.text, flex: 1 },
    suggestionTextSelected: { color: colors.accent, fontWeight: '600' },
  }), [colors])

  return (
    <View style={styles.container}>
      {/* 현재 선택된 주소 */}
      {value.trim().length > 0 && (
        <View style={styles.selectedRow}>
          <Ionicons name="location" size={16} color={colors.accent} />
          <Text style={styles.selectedText} numberOfLines={1}>
            {value}
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
          editable={!disabled}
          autoFocus={autoFocus}
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

      {hints.map((hint) => (
        <Text key={hint} style={styles.hint}>{hint}</Text>
      ))}

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
                ]}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text
                  style={[
                    styles.suggestionText,
                    item === value && styles.suggestionTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {item === value && (
                  <Ionicons name="checkmark" size={16} color={colors.accent} />
                )}
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  )
}
