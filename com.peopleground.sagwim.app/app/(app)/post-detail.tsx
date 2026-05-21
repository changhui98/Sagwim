import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { getPost, togglePostLike } from '../../src/api/postApi'
import type { ContentResponse } from '../../src/types/post'
import { resolveImageUrl } from '../../src/lib/resolveImageUrl'
import { colors, fontSize, radius, spacing } from '../../src/constants/theme'

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(isoString).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [post, setPost] = useState<ContentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const isLikeInFlight = useRef(false)

  useEffect(() => {
    const contentId = Number(id)
    if (!id || Number.isNaN(contentId)) {
      setError('잘못된 게시글 주소입니다.')
      setLoading(false)
      return
    }

    void (async () => {
      try {
        const data = await getPost(contentId)
        setPost(data)
        setLiked(data.likedByMe ?? false)
        setLikeCount(data.likeCount ?? 0)
      } catch (e) {
        console.error('[PostDetail] getPost 실패:', e)
        setError('게시글을 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleLike = useCallback(async () => {
    if (!post || isLikeInFlight.current) return
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
    } catch (e) {
      console.error('[PostDetail] togglePostLike 실패:', e)
      setLiked(prevLiked)
      setLikeCount(prevCount)
    } finally {
      isLikeInFlight.current = false
    }
  }, [post, liked, likeCount])

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )
    }

    if (error || !post) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? '게시글을 찾을 수 없어요.'}</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>돌아가기</Text>
          </Pressable>
        </View>
      )
    }

    const author = post.nickname ?? post.createdBy

    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.sp8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 작성자 정보 */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{author.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.authorMeta}>
            <Text style={styles.authorName}>{author}</Text>
            <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
          </View>
        </View>

        {/* 본문 */}
        <Text style={styles.body}>{post.body}</Text>

        {/* 태그 */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tags}>
            {post.tags.map((tag, i) => (
              <View key={`${tag}-${i}`} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 이미지 슬라이더 — imageUrls 있을 때만 렌더링 */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <ImageSlider urls={post.imageUrls} />
        )}

        {/* 액션 바 */}
        <View style={styles.actionBar}>
          <Pressable
            style={styles.actionButton}
            onPress={() => void handleLike()}
            hitSlop={8}
            accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
            accessibilityRole="button"
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? colors.error : colors.textMuted}
            />
            <Text style={[styles.actionCount, liked && styles.actionCountActive]}>
              {likeCount}
            </Text>
          </Pressable>

          <View style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={19} color={colors.textMuted} />
            <Text style={styles.actionCount}>{post.commentCount ?? 0}</Text>
          </View>
        </View>

        {/* 댓글 섹션 구분선 */}
        <View style={styles.divider} />

        {/* 댓글 플레이스홀더 */}
        <View style={styles.commentPlaceholder}>
          <Ionicons name="chatbubbles-outline" size={32} color={colors.border} />
          <Text style={styles.commentPlaceholderText}>댓글 기능은 준비 중입니다.</Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 커스텀 헤더 */}
        <View style={styles.header}>
          <Pressable
            style={styles.headerBack}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="뒤로가기"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>게시글</Text>
          <View style={styles.headerBack} />
        </View>

        {renderContent()}
      </View>
    </>
  )
}

interface ImageSliderProps {
  urls: string[]
}

function ImageSlider({ urls }: ImageSliderProps) {
  const { width } = useWindowDimensions()
  // scrollContent에 paddingHorizontal: sp4(16)이 양쪽 적용되므로 슬라이더 가용 너비는 width - 32
  const itemWidth = width - spacing.sp4 * 2
  const [index, setIndex] = useState(0)

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index)
    },
  ).current

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current

  return (
    <View>
      <FlatList
        data={urls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, i) => ({ length: itemWidth, offset: itemWidth * i, index: i })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item: url, index: i }) => {
          const uri = resolveImageUrl(url)
          return (
            <Image
              source={uri ? { uri } : undefined}
              style={{ width: itemWidth, height: 240, backgroundColor: colors.surface3 }}
              resizeMode="cover"
              accessibilityLabel={`이미지 ${i + 1}`}
            />
          )
        }}
        style={{ borderRadius: radius.lg, overflow: 'hidden' }}
      />
      {urls.length > 1 && (
        <View style={sliderStyles.dots}>
          {urls.map((_, i) => (
            <View key={i} style={[sliderStyles.dot, i === index && sliderStyles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp2,
    paddingVertical: spacing.sp3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.sp4,
    paddingTop: spacing.sp4,
    gap: spacing.sp3,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sp6,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sp4,
  },
  backButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sp6,
    paddingVertical: spacing.sp3,
    borderRadius: radius.md,
  },
  backButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#fff',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.accent,
  },
  authorMeta: {
    gap: 2,
  },
  authorName: {
    fontSize: fontSize.base,
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
    lineHeight: fontSize.base * 1.7,
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
  actionBar: {
    flexDirection: 'row',
    gap: spacing.sp4,
    paddingVertical: spacing.sp2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp1,
  },
  actionCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  actionCountActive: {
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sp3,
  },
  commentPlaceholder: {
    alignItems: 'center',
    gap: spacing.sp3,
    paddingVertical: spacing.sp8,
  },
  commentPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
})

const sliderStyles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sp1,
    paddingTop: spacing.sp2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
})
