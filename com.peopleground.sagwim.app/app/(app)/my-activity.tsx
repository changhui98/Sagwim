import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getLikedPosts } from '../../src/api/activityApi'
import { PostCard } from '../../src/components/PostCard'
import { useTheme } from '../../src/context/ThemeContext'
import { fontSize, spacing } from '../../src/constants/theme'
import type { ContentResponse } from '../../src/types/post'

const PAGE_SIZE = 10

export default function MyActivityScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()

  const [posts, setPosts] = useState<ContentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchingMore, setFetchingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const isFirstLoad = useRef(true)

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
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sp3 },
    emptyText: { fontSize: fontSize.base, color: colors.textMuted },
    separator: { height: 1, backgroundColor: colors.border },
    footer: { alignItems: 'center', paddingVertical: spacing.sp4 },
    sectionHeader: {
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface2,
    },
    sectionHeaderText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textMuted,
    },
  }), [colors])

  const loadPage = useCallback(async (pageNum: number, replace: boolean) => {
    try {
      const res = await getLikedPosts(pageNum, PAGE_SIZE)
      setPosts((prev) => replace ? res.content : [...prev, ...res.content])
      setHasNext(res.hasNext)
      setPage(pageNum)
    } catch {
      // 조용히 실패 — 이미 로드된 목록 유지
    }
  }, [])

  useEffect(() => {
    if (!isFirstLoad.current) return
    isFirstLoad.current = false
    void (async () => {
      setLoading(true)
      await loadPage(0, true)
      setLoading(false)
    })()
  }, [loadPage])

  const handleLoadMore = useCallback(async () => {
    if (fetchingMore || !hasNext) return
    setFetchingMore(true)
    await loadPage(page + 1, false)
    setFetchingMore(false)
  }, [fetchingMore, hasNext, page, loadPage])

  const handleLikeToggle = useCallback((id: number, liked: boolean, likeCount: number) => {
    setPosts((prev) =>
      prev.map((p) => p.id === id ? { ...p, likedByMe: liked, likeCount } : p)
    )
  }, [])

  const handleDelete = useCallback((id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Pressable style={styles.headerSide} onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>내 활동</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.headerSide} onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>내 활동</Text>
          <View style={styles.headerSide} />
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={() => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>좋아요한 게시글</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLikeToggle={handleLikeToggle}
              onDelete={handleDelete}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={styles.emptyText}>좋아요한 게시글이 없어요.</Text>
            </View>
          )}
          ListFooterComponent={
            fetchingMore
              ? <View style={styles.footer}><ActivityIndicator color={colors.accent} /></View>
              : null
          }
          onEndReached={() => void handleLoadMore()}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.sp8, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  )
}
