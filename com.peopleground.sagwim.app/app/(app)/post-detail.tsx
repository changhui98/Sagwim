import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { getPost, togglePostLike } from '../../src/api/postApi'
import {
  createComment,
  createReply,
  deleteComment,
  getComments,
  toggleCommentLike,
} from '../../src/api/commentApi'
import type { ContentResponse } from '../../src/types/post'
import type { CommentResponse } from '../../src/types/comment'
import { resolveImageUrl } from '../../src/lib/resolveImageUrl'
import { useAuth } from '../../src/context/AuthContext'
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

// ── 이미지 슬라이더 ──────────────────────────────────────────
interface ImageSliderProps { urls: string[] }

function ImageSlider({ urls }: ImageSliderProps) {
  const { width } = useWindowDimensions()
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

// ── 댓글 아이템 ──────────────────────────────────────────────
interface CommentItemProps {
  comment: CommentResponse
  contentId: number
  myUsername: string | null
  isReply?: boolean
  onReply: (comment: CommentResponse) => void
  onDelete: (commentId: number) => void
  onLikeToggle: (commentId: number, liked: boolean, likeCount: number) => void
}

const AVATAR_SIZE = 36
const ROW_H_PAD = spacing.sp4   // row paddingHorizontal
const ROW_V_PAD = spacing.sp3   // row paddingTop / paddingBottom
const CONNECTOR_MARGIN_TOP = 4  // gap between avatar bottom and connector start

function CommentItem({
  comment,
  contentId,
  myUsername,
  isReply = false,
  onReply,
  onDelete,
  onLikeToggle,
}: CommentItemProps) {
  const isMine = myUsername != null && comment.authorUsername === myUsername
  const hasReplies = !isReply && comment.replies.length > 0
  const [parentRowHeight, setParentRowHeight] = useState(0)

  const handleMorePress = () => {
    if (!isMine) return
    Alert.alert('댓글 옵션', undefined, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => onDelete(comment.id) },
    ])
  }

  if (comment.deleted) {
    return (
      <View style={[commentStyles.row, isReply && commentStyles.replyRow]}>
        <Text style={commentStyles.deletedText}>삭제된 댓글입니다.</Text>
      </View>
    )
  }

  const author = comment.authorNickname ?? comment.authorUsername ?? '알 수 없음'

  // 커넥터 절대 좌표 계산
  // 시작: paddingTop + avatar 높이 + marginTop = 52
  // 끝:   parentRowHeight(padding 포함) + 첫 답글 paddingTop + avatar 중심
  //       = parentRowHeight + ROW_V_PAD + AVATAR_SIZE/2
  const connectorLeft = ROW_H_PAD + AVATAR_SIZE / 2 - 1
  const connectorTop = ROW_V_PAD + AVATAR_SIZE + CONNECTOR_MARGIN_TOP
  const connectorHeight =
    parentRowHeight > 0
      ? parentRowHeight + ROW_V_PAD + AVATAR_SIZE / 2 - connectorTop
      : 0

  return (
    <View style={!isReply ? commentStyles.commentGroup : undefined}>
      {/* 부모 아바타 → 첫 번째 답글 아바타 중심을 잇는 연결선 (절대 배치) */}
      {hasReplies && connectorHeight > 0 && (
        <View
          style={[
            commentStyles.connector,
            {
              position: 'absolute',
              left: connectorLeft,
              top: connectorTop,
              height: connectorHeight,
            },
          ]}
        />
      )}

      <View
        style={[commentStyles.row, isReply && commentStyles.replyRow]}
        onLayout={hasReplies ? (e) => setParentRowHeight(e.nativeEvent.layout.height) : undefined}
      >
        {/* 아바타 컬럼 */}
        <View style={commentStyles.avatarCol}>
          <View style={commentStyles.avatar}>
            {comment.authorProfileImageUrl ? (
              <Image
                source={{ uri: resolveImageUrl(comment.authorProfileImageUrl) ?? undefined }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <Text style={commentStyles.avatarText}>
                {author.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* 내용 */}
        <View style={commentStyles.content}>
          <View style={commentStyles.header}>
            <Text style={commentStyles.author}>{author}</Text>
            <Text style={commentStyles.time}>{formatRelativeTime(comment.createdAt)}</Text>
          </View>

          <Text style={commentStyles.body}>{comment.body}</Text>

          <View style={commentStyles.actions}>
            <Pressable
              style={commentStyles.actionBtn}
              onPress={() => onLikeToggle(comment.id, comment.likedByMe, comment.likeCount)}
              hitSlop={8}
            >
              <Ionicons
                name={comment.likedByMe ? 'heart' : 'heart-outline'}
                size={13}
                color={comment.likedByMe ? colors.error : colors.textMuted}
              />
              {comment.likeCount > 0 && (
                <Text style={[commentStyles.actionCount, comment.likedByMe && commentStyles.actionCountActive]}>
                  {comment.likeCount}
                </Text>
              )}
            </Pressable>

            {!isReply && (
              <Pressable style={commentStyles.actionBtn} onPress={() => onReply(comment)} hitSlop={8}>
                <Text style={commentStyles.replyBtn}>답글</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ... 도트 버튼 (오른쪽 끝) */}
        {isMine && (
          <Pressable onPress={handleMorePress} hitSlop={8} style={commentStyles.moreDots}>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* 답글 목록 */}
      {hasReplies && (
        <View>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              contentId={contentId}
              myUsername={myUsername}
              isReply
              onReply={onReply}
              onDelete={onDelete}
              onLikeToggle={onLikeToggle}
            />
          ))}
        </View>
      )}
    </View>
  )
}

// ── 메인 화면 ────────────────────────────────────────────────
export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(app)/(tabs)')
  }
  const insets = useSafeAreaInsets()
  const { meUsername, meProfileImageUrl } = useAuth()
  const inputRef = useRef<TextInput>(null)

  const [post, setPost] = useState<ContentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const isLikeInFlight = useRef(false)

  // 댓글
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [nextCursorId, setNextCursorId] = useState<number | null>(null)
  const [hasNextComments, setHasNextComments] = useState(false)

  // 입력
  const [inputText, setInputText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyTarget, setReplyTarget] = useState<CommentResponse | null>(null)

  const contentId = Number(id)

  // 게시글 로드
  useEffect(() => {
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
      } catch {
        setError('게시글을 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 댓글 로드
  const loadComments = useCallback(async (cursor?: number) => {
    setCommentsLoading(true)
    try {
      const data = await getComments(contentId, cursor)
      setComments((prev) => (cursor !== undefined ? [...prev, ...data.comments] : data.comments))
      setNextCursorId(data.nextCursorId)
      setHasNextComments(data.hasNext)
    } catch {
      // 조용히 실패
    } finally {
      setCommentsLoading(false)
    }
  }, [contentId])

  useEffect(() => {
    if (!Number.isNaN(contentId)) void loadComments()
  }, [loadComments])

  // 좋아요
  const handleLike = useCallback(async () => {
    if (!post || isLikeInFlight.current) return
    isLikeInFlight.current = true
    const prev = { liked, likeCount }
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
    try {
      const res = await togglePostLike(post.id)
      setLiked(res.liked)
      setLikeCount(res.likeCount)
    } catch {
      setLiked(prev.liked)
      setLikeCount(prev.likeCount)
    } finally {
      isLikeInFlight.current = false
    }
  }, [post, liked, likeCount])

  // 댓글 좋아요 (낙관적 업데이트)
  const handleCommentLike = useCallback((commentId: number, wasLiked: boolean, oldCount: number) => {
    const update = (list: CommentResponse[]): CommentResponse[] =>
      list.map((c) => {
        if (c.id === commentId) {
          return { ...c, likedByMe: !wasLiked, likeCount: wasLiked ? oldCount - 1 : oldCount + 1 }
        }
        return { ...c, replies: update(c.replies) }
      })
    setComments((prev) => update(prev))
    void toggleCommentLike(commentId).then((res) => {
      setComments((prev) =>
        update(prev).map((c) =>
          c.id === commentId ? { ...c, likedByMe: res.liked, likeCount: res.likeCount } : c,
        ),
      )
    }).catch(() => {
      // 실패 시 원복
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, likedByMe: wasLiked, likeCount: oldCount } : c,
        ),
      )
    })
  }, [])

  // 댓글 삭제
  const handleDeleteComment = useCallback(async (commentId: number) => {
    try {
      await deleteComment(contentId, commentId)
      const remove = (list: CommentResponse[]): CommentResponse[] =>
        list
          .map((c) => ({ ...c, replies: remove(c.replies) }))
          .filter((c) => c.id !== commentId)
      setComments((prev) => remove(prev))
      setPost((prev) => prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount ?? 1) - 1) } : prev)
    } catch {
      Alert.alert('오류', '댓글 삭제에 실패했습니다.')
    }
  }, [contentId])

  // 댓글 / 답글 제출
  const handleSubmit = useCallback(async () => {
    const body = inputText.trim()
    if (!body || submitting) return
    setSubmitting(true)
    try {
      if (replyTarget) {
        const reply = await createReply(contentId, replyTarget.id, body)
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTarget.id ? { ...c, replies: [...c.replies, reply] } : c,
          ),
        )
      } else {
        const comment = await createComment(contentId, body)
        setComments((prev) => [comment, ...prev])
        setPost((prev) => prev ? { ...prev, commentCount: (prev.commentCount ?? 0) + 1 } : prev)
      }
      setInputText('')
      setReplyTarget(null)
    } catch {
      Alert.alert('오류', '댓글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }, [inputText, submitting, replyTarget, contentId])

  // 답글 대상 선택 → 입력창 포커스
  const handleReply = useCallback((comment: CommentResponse) => {
    setReplyTarget(comment)
    inputRef.current?.focus()
  }, [])

  // ── 렌더 ────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      </View>
    )
  }

  if (error || !post) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? '게시글을 찾을 수 없어요.'}</Text>
          <Pressable style={styles.backButton} onPress={() => goBack()}>
            <Text style={styles.backButtonText}>돌아가기</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const author = post.nickname ?? post.createdBy
  const isPostMine = !!meUsername && post.createdBy === meUsername
  const postAvatarUrl = isPostMine ? resolveImageUrl(meProfileImageUrl) : null

  // FlatList에 넘길 데이터: 게시글 헤더 + 댓글 목록
  type ListItem =
    | { type: 'post' }
    | { type: 'comment'; data: CommentResponse }
    | { type: 'more' }
    | { type: 'empty' }

  const listData: ListItem[] = [
    { type: 'post' },
    ...comments.map((c): ListItem => ({ type: 'comment', data: c })),
    ...(hasNextComments ? [{ type: 'more' } as ListItem] : []),
    ...(comments.length === 0 && !commentsLoading ? [{ type: 'empty' } as ListItem] : []),
  ]

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable style={styles.headerBack} onPress={() => goBack()} hitSlop={8} accessibilityLabel="뒤로가기">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>게시글</Text>
          <View style={styles.headerBack} />
        </View>

        {/* 콘텐츠 + 댓글 목록 */}
        <FlatList
          data={listData}
          keyExtractor={(item, i) => {
            if (item.type === 'comment') return `comment-${item.data.id}`
            return `${item.type}-${i}`
          }}
          renderItem={({ item }) => {
            if (item.type === 'post') {
              return (
                <View style={styles.postSection}>
                  {/* 작성자 */}
                  <View style={styles.authorRow}>
                    <View style={styles.avatar}>
                      {postAvatarUrl ? (
                        <Image
                          source={{ uri: postAvatarUrl }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.avatarText}>{author.slice(0, 1).toUpperCase()}</Text>
                      )}
                    </View>
                    <View style={styles.authorMeta}>
                      <Text style={styles.authorName}>{author}</Text>
                      <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
                    </View>
                  </View>

                  {/* 본문 */}
                  <Text style={styles.body}>{post.body}</Text>

                  {/* 이미지 */}
                  {(post.imageUrls?.length ?? 0) > 0 && (
                    <ImageSlider urls={post.imageUrls!} />
                  )}

                  {/* 태그 */}
                  {(post.tags?.length ?? 0) > 0 && (
                    <View style={styles.tags}>
                      {post.tags!.map((tag, i) => (
                        <View key={`${tag}-${i}`} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 액션 바 */}
                  <View style={styles.actionBar}>
                    <Pressable style={styles.actionButton} onPress={() => void handleLike()} hitSlop={8}>
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

                  {/* 댓글 구분선 */}
                  <View style={styles.divider} />
                  <Text style={styles.commentSectionTitle}>
                    댓글 {post.commentCount ?? 0}개
                  </Text>
                </View>
              )
            }

            if (item.type === 'comment') {
              return (
                <CommentItem
                  comment={item.data}
                  contentId={contentId}
                  myUsername={meUsername}
                  onReply={handleReply}
                  onDelete={(cid) => void handleDeleteComment(cid)}
                  onLikeToggle={handleCommentLike}
                />
              )
            }

            if (item.type === 'more') {
              return (
                <Pressable
                  style={styles.moreBtn}
                  onPress={() => void loadComments(nextCursorId ?? undefined)}
                  disabled={commentsLoading}
                >
                  {commentsLoading
                    ? <ActivityIndicator size="small" color={colors.accent} />
                    : <Text style={styles.moreBtnText}>댓글 더 보기</Text>
                  }
                </Pressable>
              )
            }

            if (item.type === 'empty') {
              return (
                <View style={styles.emptyComments}>
                  <Ionicons name="chatbubbles-outline" size={28} color={colors.border} />
                  <Text style={styles.emptyCommentsText}>첫 댓글을 남겨보세요.</Text>
                </View>
              )
            }

            return null
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.sp4 }}
          ListFooterComponent={commentsLoading && comments.length === 0
            ? <View style={styles.emptyComments}><ActivityIndicator color={colors.accent} /></View>
            : null
          }
        />

        {/* 하단 댓글 입력 바 */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sp2 }]}>
          {replyTarget && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText} numberOfLines={1}>
                <Text style={{ fontWeight: '700' }}>
                  {replyTarget.authorNickname ?? replyTarget.authorUsername}
                </Text>
                에게 답글
              </Text>
              <Pressable onPress={() => setReplyTarget(null)} hitSlop={8}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          )}
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={replyTarget ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
                placeholderTextColor={colors.textMuted}
                multiline
                returnKeyType="default"
              />
              <Pressable
                style={styles.photoBtn}
                onPress={() => {/* 추후 사진 첨부 구현 */}}
                hitSlop={8}
                accessibilityLabel="사진 첨부"
              >
                <Ionicons name="image-outline" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <Pressable
              style={[styles.sendBtn, (!inputText.trim() || submitting) && styles.sendBtnDisabled]}
              onPress={() => void handleSubmit()}
              disabled={!inputText.trim() || submitting}
              accessibilityLabel="댓글 전송"
            >
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={18} color="#fff" />
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  )
}

// ── 스타일 ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.sp6 },
  errorText: { fontSize: fontSize.base, color: colors.error, textAlign: 'center', marginBottom: spacing.sp4 },
  backButton: { backgroundColor: colors.accent, paddingHorizontal: spacing.sp6, paddingVertical: spacing.sp3, borderRadius: radius.md },
  backButtonText: { fontSize: fontSize.base, fontWeight: '600', color: '#fff' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sp2, paddingVertical: spacing.sp3,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: fontSize.md, fontWeight: '600', color: colors.text },

  // 게시글 섹션
  postSection: { paddingHorizontal: spacing.sp4, paddingTop: spacing.sp4, gap: spacing.sp3 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sp3 },
  avatar: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.accentMuted, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { fontSize: fontSize.md, fontWeight: '700', color: colors.accent },
  authorMeta: { gap: 2 },
  authorName: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
  time: { fontSize: fontSize.xs, color: colors.textMuted },
  body: { fontSize: fontSize.base, color: colors.text, lineHeight: fontSize.base * 1.7 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sp2 },
  tag: { backgroundColor: colors.accentMuted, paddingHorizontal: spacing.sp2, paddingVertical: 3, borderRadius: radius.sm },
  tagText: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '500' },
  actionBar: { flexDirection: 'row', gap: spacing.sp4, paddingVertical: spacing.sp2 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sp1 },
  actionCount: { fontSize: fontSize.sm, color: colors.textMuted },
  actionCountActive: { color: colors.error },
  divider: { height: 1, backgroundColor: colors.border, marginTop: spacing.sp2 },
  commentSectionTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, paddingBottom: spacing.sp2 },

  // 더 보기 / 빈 댓글
  moreBtn: { alignItems: 'center', paddingVertical: spacing.sp4 },
  moreBtnText: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600' },
  emptyComments: { alignItems: 'center', gap: spacing.sp2, paddingVertical: spacing.sp8 },
  emptyCommentsText: { fontSize: fontSize.sm, color: colors.textMuted },

  // 입력 바
  inputBar: {
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingTop: spacing.sp2,
    paddingHorizontal: spacing.sp3,
  },
  replyIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sp3,
    paddingVertical: spacing.sp2,
    marginBottom: spacing.sp2,
  },
  replyIndicatorText: { flex: 1, fontSize: fontSize.xs, color: colors.textMuted },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sp2 },
  input: {
    flex: 1,
    minHeight: 22,
    maxHeight: 80,
    fontSize: fontSize.base,
    color: colors.text,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface2,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp2,
    minHeight: 38,
  },
  photoBtn: {
    paddingLeft: spacing.sp2,
    paddingBottom: 2,
  },
  sendBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border },
})

const commentStyles = StyleSheet.create({
  // 부모+대댓글 전체를 감싸는 그룹 - 구분선은 여기에
  commentGroup: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sp4,
    paddingTop: spacing.sp3,
    paddingBottom: spacing.sp3,
  },
  replyRow: {},
  avatarCol: {
    width: 36,
    alignItems: 'center',
    marginRight: spacing.sp3,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accentMuted,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.accent },
  // 부모 아바타 → 첫 답글 아바타 중심을 잇는 선 (absolute 배치로 사용)
  connector: {
    width: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  content: { flex: 1, gap: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sp2, flexWrap: 'wrap' },
  author: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  time: { fontSize: fontSize.xs, color: colors.textMuted },
  body: { fontSize: fontSize.base, color: colors.text, lineHeight: fontSize.base * 1.5 },
  deletedText: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sp4, marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actionCount: { fontSize: fontSize.xs, color: colors.textMuted },
  actionCountActive: { color: colors.error },
  replyBtn: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  moreDots: { paddingTop: 2, paddingLeft: spacing.sp1 },
})

const sliderStyles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sp1, paddingTop: spacing.sp2 },
  dot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent },
})
