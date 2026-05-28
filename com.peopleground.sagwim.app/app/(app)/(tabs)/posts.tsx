import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { getPosts } from '../../../src/api/postApi'
import type { ContentResponse } from '../../../src/types/post'
import { PostCard } from '../../../src/components/PostCard'
import { fontSize, radius, spacing } from '../../../src/constants/theme'
import { useTheme } from '../../../src/context/ThemeContext'


export default function PostsScreen() {
  const { colors } = useTheme()
  const [posts, setPosts] = useState<ContentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const hasNextRef = useRef(false)
  const nextPage = useRef(0)

  const handleLikeToggle = useCallback(
    (id: number, liked: boolean, likeCount: number) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likedByMe: liked, likeCount } : p)),
      )
    },
    [],
  )

  const loadInitial = useCallback(async () => {
    setError(null)
    try {
      const res = await getPosts(0, 12)
      setPosts(res.content)
      hasNextRef.current = res.hasNext
      setHasNext(res.hasNext)
      nextPage.current = 1
    } catch {
      setError('게시글을 불러오지 못했어요.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadInitial()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    nextPage.current = 0
    void loadInitial()
  }, [loadInitial])

  const loadingMoreRef = useRef(false)

  const onEndReached = useCallback(async () => {
    if (!hasNextRef.current || loadingMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const res = await getPosts(nextPage.current, 12)
      setPosts((prev) => [...prev, ...res.content])
      hasNextRef.current = res.hasNext
      setHasNext(res.hasNext)
      nextPage.current += 1
    } catch {
      // silent fail — retry on next scroll
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [])

  const styles = useMemo(() => StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.sp6,
      backgroundColor: colors.bg,
    },
    listContent: {
      paddingBottom: spacing.sp8,
    },
    emptyContainer: {
      flex: 1,
      paddingHorizontal: spacing.sp4,
    },
    emptyText: {
      fontSize: fontSize.base,
      color: colors.textMuted,
    },
    errorText: {
      fontSize: fontSize.base,
      color: colors.error,
      marginBottom: spacing.sp4,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sp6,
      paddingVertical: spacing.sp3,
      borderRadius: radius.md,
    },
    retryText: {
      fontSize: fontSize.base,
      fontWeight: '600',
      color: '#fff',
    },
    footerLoader: {
      paddingVertical: spacing.sp4,
    },
  }), [colors])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setLoading(true)
            void loadInitial()
          }}
        >
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.safe}>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <PostCard post={item} onLikeToggle={handleLikeToggle} />}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>아직 게시글이 없어요.</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              style={styles.footerLoader}
              size="small"
              color={colors.accent}
            />
          ) : null
        }
        ItemSeparatorComponent={null}
      />
    </View>
  )
}
