import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getGroups } from '../../src/api/groupApi'
import { GroupCard } from '../../src/components/group/GroupCard'
import type { GroupResponse } from '../../src/types/group'
import { fontSize, spacing } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'

const PAGE_SIZE = 20

export default function GroupListScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const params = useLocalSearchParams<{ title?: string }>()
  const title = params.title ?? '모든 모임'

  const [groups, setGroups] = useState<GroupResponse[]>([])
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
      backgroundColor: colors.surface,
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
    column: { gap: spacing.sp3, marginBottom: spacing.sp3 },
    footer: { alignItems: 'center', paddingVertical: spacing.sp4 },
  }), [colors])

  const loadPage = useCallback(async (pageNum: number, replace: boolean) => {
    try {
      const res = await getGroups(pageNum, PAGE_SIZE)
      setGroups((prev) => replace ? res.content : [...prev, ...res.content])
      setHasNext(res.hasNext)
      setPage(pageNum)
    } catch {
      // 조용히 실패 — 기존 목록 유지
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

  const handlePressGroup = useCallback((groupId: number) => {
    router.push({ pathname: '/(app)/group-detail', params: { id: String(groupId) } })
  }, [])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.headerSide} onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.headerSide} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(g) => String(g.id)}
            renderItem={({ item }) => (
              <GroupCard group={item} onPress={handlePressGroup} />
            )}
            numColumns={3}
            columnWrapperStyle={styles.column}
            ListEmptyComponent={() => (
              <View style={styles.center}>
                <Text style={styles.emptyText}>노출 범위 내 모임이 아직 없어요.</Text>
              </View>
            )}
            ListFooterComponent={
              fetchingMore
                ? <View style={styles.footer}><ActivityIndicator color={colors.accent} /></View>
                : null
            }
            onEndReached={() => void handleLoadMore()}
            onEndReachedThreshold={0.3}
            contentContainerStyle={{
              paddingHorizontal: spacing.sp4,
              paddingTop: spacing.sp4,
              paddingBottom: insets.bottom + spacing.sp8,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  )
}
