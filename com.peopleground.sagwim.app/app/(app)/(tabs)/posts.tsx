import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { getPosts, togglePostLike } from '../../../src/api/postApi'
import type { ContentResponse } from '../../../src/types/post'
import { resolveImageUrl } from '../../../src/lib/resolveImageUrl'
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
  onLikeToggle: (id: number, liked: boolean, likeCount: number) => void
}

function PostCard({ post, onLikeToggle }: PostCardProps) {
  const router = useRouter()
  const author = post.nickname ?? post.createdBy

  const [liked, setLiked] = useState(post.likedByMe ?? false)
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0)
  const isLikeInFlight = useRef(false)

  const handleLike = useCallback(async () => {
    if (isLikeInFlight.current) return
    isLikeInFlight.current = true

    const prevLiked = liked
    const prevCount = likeCount
    const nextLiked = !liked
    const nextCount = nextLiked ? likeCount + 1 : likeCount - 1

    setLiked(nextLiked)
    setLikeCount(nextCount)

    try {
      const res = await togglePostLike(post.id)
      setLiked(res.liked)
      setLikeCount(res.likeCount)
      onLikeToggle(post.id, res.liked, res.likeCount)
    } catch (e) {
      console.error('[PostCard] togglePostLike 실패:', e)
      setLiked(prevLiked)
      setLikeCount(prevCount)
    } finally {
      isLikeInFlight.current = false
    }
  }, [liked, likeCount, post.id, onLikeToggle])

  const goToDetail = useCallback(() => {
    router.push({ pathname: '/(app)/post-detail', params: { id: String(post.id) } })
  }, [router, post.id])

  return (
    <Pressable
      onPress={goToDetail}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${author}의 게시글`}
    >
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

      {post.imageUrls && post.imageUrls.length > 0 && (() => {
        const uri = resolveImageUrl(post.imageUrls![0])
        return uri ? (
          <Image
            source={{ uri }}
            style={styles.postImage}
            resizeMode="cover"
            accessibilityLabel="게시글 이미지"
          />
        ) : null
      })()}

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
        <Pressable
          style={styles.footerButton}
          onPress={handleLike}
          hitSlop={8}
          accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
          accessibilityRole="button"
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={17}
            color={liked ? colors.error : colors.textMuted}
          />
          <Text style={[styles.footerCount, liked && styles.footerCountActive]}>
            {likeCount}
          </Text>
        </Pressable>

        <Pressable
          style={styles.footerButton}
          onPress={goToDetail}
          hitSlop={8}
          accessibilityLabel="댓글 보기"
          accessibilityRole="button"
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerCount}>{post.commentCount ?? 0}</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

export default function PostsScreen() {
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardPressed: {
    backgroundColor: colors.surface2,
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
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
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
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp1,
  },
  footerCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  footerCountActive: {
    color: colors.error,
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
