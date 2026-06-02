import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Stack, router, useFocusEffect } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { searchUsers } from '../../../src/api/userApi'
import { getPosts } from '../../../src/api/postApi'
import { getGroups } from '../../../src/api/groupApi'
import { getSearchHistory, saveSearchHistory } from '../../../src/api/searchHistoryApi'
import { resolveImageUrl } from '../../../src/lib/resolveImageUrl'
import { fontSize, radius, spacing } from '../../../src/constants/theme'
import { useTheme } from '../../../src/context/ThemeContext'
import type { UserResponse } from '../../../src/types/user'
import type { ContentResponse } from '../../../src/types/post'
import type { GroupResponse } from '../../../src/types/group'
import { GROUP_CATEGORY_LABELS } from '../../../src/types/group'
import type { SearchHistoryResponse } from '../../../src/types/searchHistory'

interface SearchResults {
  users: UserResponse[]
  posts: ContentResponse[]
  groups: GroupResponse[]
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const inputRef = useRef<TextInput>(null)

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [recent, setRecent] = useState<SearchHistoryResponse[]>([])

  // 탭 진입 시 입력창 포커스 + 최근 검색 기록 갱신
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => inputRef.current?.focus(), 250)
      getSearchHistory().then(setRecent).catch(() => {})
      return () => clearTimeout(timer)
    }, []),
  )

  // 검색어 디바운스(300ms) 후 유저·게시글·모임 병렬 조회
  React.useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(null)
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [usersRes, postsRes, groupsRes] = await Promise.allSettled([
          searchUsers(trimmed, 0, 5),
          getPosts(0, 5, trimmed, 'TITLE'),
          getGroups(0, 5, trimmed),
        ])
        setResults({
          users: usersRes.status === 'fulfilled' ? usersRes.value.content : [],
          posts: postsRes.status === 'fulfilled' ? postsRes.value.content : [],
          groups: groupsRes.status === 'fulfilled' ? groupsRes.value.content : [],
        })
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleUserPress = useCallback((username: string) => {
    Keyboard.dismiss()
    void saveSearchHistory('USER', username).catch(() => {})
    router.push({ pathname: '/(app)/user-profile', params: { username } })
  }, [])

  const handlePostPress = useCallback((id: number) => {
    Keyboard.dismiss()
    void saveSearchHistory('POST', String(id)).catch(() => {})
    router.push({ pathname: '/(app)/post-detail', params: { id: String(id) } })
  }, [])

  const handleGroupPress = useCallback((id: number) => {
    Keyboard.dismiss()
    void saveSearchHistory('GROUP', String(id)).catch(() => {})
    router.push({ pathname: '/(app)/group-detail', params: { id: String(id) } })
  }, [])

  // 최근 검색 항목 클릭 — type 별 상세로 이동 (재방문도 기록 갱신)
  const handleRecentPress = useCallback((item: SearchHistoryResponse) => {
    if (item.type === 'USER') handleUserPress(item.targetId)
    else if (item.type === 'POST') handlePostPress(Number(item.targetId))
    else handleGroupPress(Number(item.targetId))
  }, [handleUserPress, handlePostPress, handleGroupPress])

  const hasResults =
    !!results &&
    (results.users.length > 0 || results.posts.length > 0 || results.groups.length > 0)

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sp3,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface2,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.sp3,
      height: 40,
    },
    searchInput: {
      flex: 1,
      marginLeft: spacing.sp2,
      fontSize: fontSize.base,
      color: colors.text,
      padding: 0,
    },
    centerWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sp10 },
    emptyText: { fontSize: fontSize.base, color: colors.textMuted },
    section: { paddingTop: spacing.sp3 },
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textMuted,
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp2,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
      gap: spacing.sp3,
    },
    itemPressed: { backgroundColor: colors.surface2 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2 },
    avatarFallback: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: { fontSize: fontSize.base, fontWeight: '700', color: colors.accent },
    meta: { flex: 1, gap: 2 },
    primary: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
    secondary: { fontSize: fontSize.sm, color: colors.textMuted },
  }), [colors])

  const renderUserRow = (user: UserResponse) => {
    const avatarUri = resolveImageUrl(user.profileImageUrl)
    return (
      <Pressable
        key={`user-${user.username}`}
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        onPress={() => handleUserPress(user.username)}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{user.nickname.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.primary} numberOfLines={1}>{user.nickname}</Text>
        </View>
      </Pressable>
    )
  }

  const renderPostRow = (post: ContentResponse) => (
    <Pressable
      key={`post-${post.id}`}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={() => handlePostPress(post.id)}
    >
      <View style={styles.meta}>
        <Text style={styles.primary} numberOfLines={1}>
          {post.body.length > 60 ? post.body.slice(0, 60) + '…' : post.body}
        </Text>
        <Text style={styles.secondary} numberOfLines={1}>{post.nickname ?? post.createdBy}</Text>
      </View>
    </Pressable>
  )

  const renderGroupRow = (group: GroupResponse) => {
    const imageUri = resolveImageUrl(group.imageUrl)
    return (
      <Pressable
        key={`group-${group.id}`}
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        onPress={() => handleGroupPress(group.id)}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{group.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.primary} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.secondary} numberOfLines={1}>
            {GROUP_CATEGORY_LABELS[group.category]} · {group.currentMemberCount}명
          </Text>
        </View>
      </Pressable>
    )
  }

  const renderRecentRow = (item: SearchHistoryResponse) => {
    const avatarUri = item.type === 'USER' ? resolveImageUrl(item.profileImageUrl) : null
    const showAvatar = item.type !== 'POST'
    const typeLabel = item.type === 'USER' ? '유저' : item.type === 'POST' ? '게시글' : '모임'
    return (
      <Pressable
        key={`${item.type}-${item.targetId}`}
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        onPress={() => handleRecentPress(item)}
      >
        {showAvatar && (
          avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{item.label.charAt(0).toUpperCase()}</Text>
            </View>
          )
        )}
        <View style={styles.meta}>
          <Text style={styles.primary} numberOfLines={1}>
            {item.label.length > 60 ? item.label.slice(0, 60) + '…' : item.label}
          </Text>
          <Text style={styles.secondary} numberOfLines={1}>{typeLabel}</Text>
        </View>
      </Pressable>
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>검색</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="유저 · 게시글 · 모임 검색"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.sp8 }}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.centerWrap}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          )}

          {!loading && !query.trim() && recent.length === 0 && (
            <View style={styles.centerWrap}>
              <Text style={styles.emptyText}>검색어를 입력해주세요.</Text>
            </View>
          )}

          {!loading && !query.trim() && recent.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>최근 검색</Text>
              {recent.map(renderRecentRow)}
            </View>
          )}

          {!loading && query.trim() && results && !hasResults && (
            <View style={styles.centerWrap}>
              <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
            </View>
          )}

          {!loading && results && results.users.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>유저</Text>
              {results.users.map(renderUserRow)}
            </View>
          )}

          {!loading && results && results.posts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>게시글</Text>
              {results.posts.map(renderPostRow)}
            </View>
          )}

          {!loading && results && results.groups.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>모임</Text>
              {results.groups.map(renderGroupRow)}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  )
}
