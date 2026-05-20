import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getPosts } from '../../../src/api/postApi'
import type { ContentResponse } from '../../../src/types/post'
import { colors, fontSize, radius, spacing } from '../../../src/constants/theme'

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(isoString).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
}

interface PostCardProps {
  post: ContentResponse
}

function PostCard({ post }: PostCardProps) {
  const author = post.nickname ?? post.createdBy

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{author.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.authorWrap}>
          <Text style={styles.author}>{author}</Text>
          <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
        <Pressable
          style={styles.menuButton}
          hitSlop={8}
          onPress={() => console.log('[Post] menu press:', post.id)}
          accessibilityLabel="더보기"
          accessibilityRole="button"
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.body} numberOfLines={3}>
        {post.body}
      </Text>

      {post.tags && post.tags.length > 0 && (
        <View style={styles.tags}>
          {post.tags.map((tag, i) => (
            <View key={`${tag}-${i}`} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerItem}>♥ {post.likeCount ?? 0}</Text>
        <Text style={styles.footerItem}>💬 {post.commentCount ?? 0}</Text>
      </View>
    </View>
  )
}

export default function PostsScreen() {
  const [posts, setPosts] = useState<ContentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const nextPage = useRef(0)

  const loadPage = useCallback(async (page: number) => {
    const res = await getPosts(page, 12)
    return res
  }, [])

  const loadInitial = useCallback(async () => {
    setError(null)
    try {
      const res = await loadPage(0)
      setPosts(res.content)
      setHasNext(res.hasNext)
      nextPage.current = 1
    } catch {
      setError('게시글을 불러오지 못했어요.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [loadPage])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    nextPage.current = 0
    void loadInitial()
  }, [loadInitial])

  const onEndReached = useCallback(async () => {
    if (!hasNext || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await loadPage(nextPage.current)
      setPosts((prev) => [...prev, ...res.content])
      setHasNext(res.hasNext)
      nextPage.current += 1
    } catch {
      // 추가 로드 실패는 조용히 무시 — 다음 스크롤 시 재시도
    } finally {
      setLoadingMore(false)
    }
  }, [hasNext, loadingMore, loadPage])

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
        renderItem={({ item }) => <PostCard post={item} />}
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

const styles = StyleSheet.create({
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
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sp4,
  },
  card: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp4,
    gap: spacing.sp3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp3,
  },
  menuButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.accent,
  },
  authorWrap: {
    flex: 1,
    gap: 2,
  },
  author: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: fontSize.base * 1.55,
    marginVertical: spacing.sp3,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sp2,
  },
  tag: {
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sp2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.accent,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sp4,
  },
  footerItem: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
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
})
