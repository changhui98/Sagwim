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
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getLikedActivities } from '../../src/api/activityApi'
import { useTheme } from '../../src/context/ThemeContext'
import { fontSize, spacing } from '../../src/constants/theme'
import type { LikedActivityResponse } from '../../src/types/activity'

const PAGE_SIZE = 10

export default function MyActivityScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()

  const [posts, setPosts] = useState<LikedActivityResponse[]>([])
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
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
    },
    itemText: {
      flex: 1,
      fontSize: fontSize.base,
      lineHeight: fontSize.base * 1.45,
      color: colors.text,
    },
  }), [colors])

  const loadPage = useCallback(async (pageNum: number, replace: boolean) => {
    try {
      const res = await getLikedActivities(pageNum, PAGE_SIZE)
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
          keyExtractor={(item) => `${item.type}-${item.targetId}`}
          renderItem={({ item }) => {
            const target = item.type === 'GROUP'
              ? { pathname: '/(app)/group-detail' as const, params: { id: String(item.targetId) } }
              : { pathname: '/(app)/post-detail' as const, params: { id: String(item.targetId) } }
            const text = item.type === 'GROUP'
              ? `${item.label} 모임에 좋아요를 남겼습니다.`
              : `${item.label}에 좋아요를 남겼습니다.`
            return (
              <Pressable style={styles.item} onPress={() => router.push(target)}>
                <Text style={styles.itemText}>{text}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            )
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={styles.emptyText}>좋아요한 활동이 없어요.</Text>
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
