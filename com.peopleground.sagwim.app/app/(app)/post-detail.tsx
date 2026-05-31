import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { deletePost, getPost, togglePostLike } from '../../src/api/postApi'
import {
  createComment,
  createReply,
  deleteComment,
  getComments,
  toggleCommentLike,
  updateComment,
} from '../../src/api/commentApi'
import type { ContentResponse } from '../../src/types/post'
import type { CommentResponse } from '../../src/types/comment'
import { resolveImageUrl } from '../../src/lib/resolveImageUrl'
import { useAuth } from '../../src/context/AuthContext'
import { ActionSheet, type ActionSheetOption } from '../../src/components/common/ActionSheet'
import { ConfirmDialog } from '../../src/components/common/ConfirmDialog'
import { ReportModal } from '../../src/components/common/ReportModal'
import { fontSize, radius, spacing } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'

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

const MAX_IMAGE_HEIGHT = 480

function ImageSlider({ urls }: ImageSliderProps) {
  const { colors } = useTheme()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const itemWidth = screenWidth - spacing.sp4 * 2
  const maxHeight = Math.min(MAX_IMAGE_HEIGHT, Math.round(screenHeight * 0.65))

  const [index, setIndex] = useState(0)
  const [heights, setHeights] = useState<number[]>(() => new Array(urls.length).fill(maxHeight))

  useEffect(() => {
    urls.forEach((url, i) => {
      const uri = resolveImageUrl(url)
      if (!uri) return
      Image.getSize(uri, (w, h) => {
        const ratio = h / w
        const calculated = Math.min(Math.round(ratio * itemWidth), maxHeight)
        setHeights((prev) => {
          const next = [...prev]
          next[i] = calculated
          return next
        })
      })
    })
  }, [urls, itemWidth, maxHeight])

  const containerHeight = Math.max(...heights)

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
          const imgHeight = heights[i]
          return (
            <View style={{ width: itemWidth, height: containerHeight, justifyContent: 'center' }}>
              <Image
                source={uri ? { uri } : undefined}
                style={{ width: itemWidth, height: imgHeight }}
                resizeMode="contain"
                accessibilityLabel={`이미지 ${i + 1}`}
              />
            </View>
          )
        }}
        style={{ borderRadius: radius.lg, overflow: 'hidden' }}
      />
      {urls.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sp1, paddingTop: spacing.sp2 }}>
          {urls.map((_, i) => (
            <View
              key={i}
              style={{
                width: 6, height: 6, borderRadius: radius.full,
                backgroundColor: i === index ? colors.accent : colors.border,
              }}
            />
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
  editingCommentId: number | null
  editBody: string
  editSubmitting: boolean
  onEditStart: (comment: CommentResponse) => void
  onEditCancel: () => void
  onEditBodyChange: (text: string) => void
  onEditSubmit: () => void
  onReply: (comment: CommentResponse) => void
  onDelete: (commentId: number) => void
  onLikeToggle: (commentId: number, liked: boolean, likeCount: number) => void
  onReport: (commentId: number) => void
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
  editingCommentId,
  editBody,
  editSubmitting,
  onEditStart,
  onEditCancel,
  onEditBodyChange,
  onEditSubmit,
  onReply,
  onDelete,
  onLikeToggle,
  onReport,
}: CommentItemProps) {
  const { colors } = useTheme()
  const commentStyles = useMemo(() => StyleSheet.create({
    commentGroup: {},
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.sp4,
      paddingTop: spacing.sp3,
      paddingBottom: spacing.sp3,
    },
    replyRow: {},
    avatarCol: { width: 36, alignItems: 'center', marginRight: spacing.sp3 },
    avatar: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.accentMuted,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    },
    avatarText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.accent },
    connector: { width: 2, backgroundColor: colors.border, borderRadius: 1 },
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
    editArea: { gap: spacing.sp2, marginTop: 2 },
    editInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sp3,
      paddingVertical: spacing.sp2,
      fontSize: fontSize.base,
      color: colors.text,
      backgroundColor: colors.surface2,
      minHeight: 60,
    },
    editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sp2 },
    editCancelBtn: {
      paddingHorizontal: spacing.sp3,
      paddingVertical: spacing.sp2,
      borderRadius: radius.sm,
    },
    editCancelText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
    editSubmitBtn: {
      paddingHorizontal: spacing.sp3,
      paddingVertical: spacing.sp2,
      borderRadius: radius.sm,
      backgroundColor: colors.accent,
    },
    editSubmitBtnDisabled: { backgroundColor: colors.border },
    editSubmitText: { fontSize: fontSize.sm, color: '#fff', fontWeight: '700' },
  }), [colors])

  const isMine = myUsername != null && comment.authorUsername === myUsername
  const hasReplies = !isReply && comment.replies.length > 0
  const [parentRowHeight, setParentRowHeight] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const isEditing = editingCommentId === comment.id

  const handleMorePress = () => {
    setShowMenu(true)
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

          {isEditing ? (
            <View style={commentStyles.editArea}>
              <TextInput
                style={commentStyles.editInput}
                value={editBody}
                onChangeText={onEditBodyChange}
                multiline
                autoFocus
                placeholder="댓글을 입력하세요"
                placeholderTextColor={colors.textMuted}
              />
              <View style={commentStyles.editActions}>
                <Pressable
                  style={commentStyles.editCancelBtn}
                  onPress={onEditCancel}
                  hitSlop={8}
                >
                  <Text style={commentStyles.editCancelText}>취소</Text>
                </Pressable>
                <Pressable
                  style={[
                    commentStyles.editSubmitBtn,
                    (!editBody.trim() || editSubmitting) && commentStyles.editSubmitBtnDisabled,
                  ]}
                  onPress={onEditSubmit}
                  disabled={!editBody.trim() || editSubmitting}
                  hitSlop={8}
                >
                  {editSubmitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={commentStyles.editSubmitText}>저장</Text>
                  }
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={commentStyles.body}>{comment.body}</Text>
          )}

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
        <Pressable onPress={handleMorePress} hitSlop={8} style={commentStyles.moreDots}>
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
        </Pressable>
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
              editingCommentId={editingCommentId}
              editBody={editBody}
              editSubmitting={editSubmitting}
              onEditStart={onEditStart}
              onEditCancel={onEditCancel}
              onEditBodyChange={onEditBodyChange}
              onEditSubmit={onEditSubmit}
              onReply={onReply}
              onDelete={onDelete}
              onLikeToggle={onLikeToggle}
              onReport={onReport}
            />
          ))}
        </View>
      )}

      <ActionSheet
        isOpen={showMenu}
        options={
          isMine
            ? [
                {
                  label: '수정',
                  onPress: () => onEditStart(comment),
                },
                {
                  label: '삭제',
                  variant: 'destructive',
                  onPress: () => onDelete(comment.id),
                },
              ]
            : [
                { label: '신고하기', variant: 'destructive', onPress: () => onReport(comment.id) },
              ]
        }
        onClose={() => setShowMenu(false)}
      />
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
  const { colors } = useTheme()
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
  const [showPostMenu, setShowPostMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 댓글 수정 (인라인)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editBody, setEditBody] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // 신고 모달
  const [reportCommentId, setReportCommentId] = useState<number | null>(null)
  const [showPostReport, setShowPostReport] = useState(false)
  const [showPostAlreadyReported, setShowPostAlreadyReported] = useState(false)

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

  const handleReportComment = useCallback((commentId: number) => {
    setReportCommentId(commentId)
  }, [])

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

  // 댓글 수정 시작
  const handleEditStart = useCallback((comment: CommentResponse) => {
    setEditingCommentId(comment.id)
    setEditBody(comment.body)
  }, [])

  const handleEditCancel = useCallback(() => {
    setEditingCommentId(null)
    setEditBody('')
  }, [])

  const handleEditSubmit = useCallback(async () => {
    if (editingCommentId == null) return
    const body = editBody.trim()
    if (!body || editSubmitting) return
    setEditSubmitting(true)
    try {
      const updated = await updateComment(contentId, editingCommentId, body)
      const apply = (list: CommentResponse[]): CommentResponse[] =>
        list.map((c) => {
          if (c.id === editingCommentId) {
            return { ...c, body: updated.body }
          }
          return { ...c, replies: apply(c.replies) }
        })
      setComments((prev) => apply(prev))
      setEditingCommentId(null)
      setEditBody('')
    } catch {
      Alert.alert('오류', '댓글 수정에 실패했습니다.')
    } finally {
      setEditSubmitting(false)
    }
  }, [contentId, editingCommentId, editBody, editSubmitting])

  const styles = useMemo(() => StyleSheet.create({
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
    actionBar: { flexDirection: 'row', gap: spacing.sp4, paddingVertical: spacing.sp2, marginBottom: spacing.sp4 },
    actionButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sp1 },
    actionCount: { fontSize: fontSize.sm, color: colors.textMuted },
    actionCountActive: { color: colors.error },
    divider: { height: 1, backgroundColor: colors.border, marginTop: spacing.sp2 },
    commentSectionTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, paddingBottom: spacing.sp2 },
    sectionHeader: {
      paddingHorizontal: spacing.sp4,
      paddingTop: spacing.sp4,
      paddingBottom: spacing.sp2,
    },
    sectionHeaderText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    moreBtn: { alignItems: 'center', paddingVertical: spacing.sp4 },
    moreBtnText: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600' },
    emptyComments: { alignItems: 'center', gap: spacing.sp2, paddingVertical: spacing.sp8 },
    emptyCommentsText: { fontSize: fontSize.sm, color: colors.textMuted },
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
    photoBtn: { paddingLeft: spacing.sp2, paddingBottom: 2 },
    sendBtn: {
      width: 38, height: 38,
      borderRadius: 19,
      backgroundColor: colors.accent,
      alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { backgroundColor: colors.border },
  }), [colors])

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

  // 인기 댓글 / 전체 댓글 분리 (웹과 동일 로직)
  // 상위 3개: 좋아요 많은 순, 동점 시 최신순 / 나머지: 최신순
  const topComments = [...comments]
    .filter((c) => !c.deleted && c.likeCount > 0)
    .sort((a, b) => {
      if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 3)
  const topIds = new Set(topComments.map((c) => c.id))
  const restComments = comments
    .filter((c) => !topIds.has(c.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // FlatList에 넘길 데이터: 게시글 헤더 + 댓글 목록
  type ListItem =
    | { type: 'post' }
    | { type: 'section-header'; title: string }
    | { type: 'comment'; data: CommentResponse }
    | { type: 'more' }
    | { type: 'empty' }

  const listData: ListItem[] = [
    { type: 'post' },
    ...(comments.length === 0 && !commentsLoading
      ? [{ type: 'empty' } as ListItem]
      : []),
    ...(topComments.length > 0
      ? [
          { type: 'section-header', title: '인기 댓글' } as ListItem,
          ...topComments.map((c): ListItem => ({ type: 'comment', data: c })),
        ]
      : []),
    ...(restComments.length > 0
      ? [
          { type: 'section-header', title: '전체 댓글' } as ListItem,
          ...restComments.map((c): ListItem => ({ type: 'comment', data: c })),
        ]
      : []),
    ...(hasNextComments ? [{ type: 'more' } as ListItem] : []),
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
          <Pressable
            style={styles.headerBack}
            hitSlop={8}
            onPress={() => post && setShowPostMenu(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* 콘텐츠 + 댓글 목록 */}
        <FlatList
          data={listData}
          keyExtractor={(item, i) => {
            if (item.type === 'comment') return `comment-${item.data.id}`
            if (item.type === 'section-header') return `section-${item.title}-${i}`
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

                </View>
              )
            }

            if (item.type === 'section-header') {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{item.title}</Text>
                </View>
              )
            }

            if (item.type === 'comment') {
              return (
                <CommentItem
                  comment={item.data}
                  contentId={contentId}
                  myUsername={meUsername}
                  editingCommentId={editingCommentId}
                  editBody={editBody}
                  editSubmitting={editSubmitting}
                  onEditStart={handleEditStart}
                  onEditCancel={handleEditCancel}
                  onEditBodyChange={setEditBody}
                  onEditSubmit={() => void handleEditSubmit()}
                  onReply={handleReply}
                  onDelete={(cid) => void handleDeleteComment(cid)}
                  onLikeToggle={handleCommentLike}
                  onReport={handleReportComment}
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

      {post && (
        <>
          <ActionSheet
            isOpen={showPostMenu}
            options={
              isPostMine
                ? [
                    {
                      label: '수정',
                      onPress: () => router.push({
                        pathname: '/(app)/post-edit',
                        params: {
                          contentId: String(post.id),
                          initialBody: post.body,
                          initialTags: JSON.stringify(post.tags ?? []),
                        },
                      }),
                    },
                    {
                      label: '삭제',
                      variant: 'destructive',
                      onPress: () => setShowDeleteConfirm(true),
                    },
                  ]
                : [
                    {
                      label: '신고하기',
                      variant: 'destructive',
                      onPress: () => {
                        if (post.reportedByMe) setShowPostAlreadyReported(true)
                        else setShowPostReport(true)
                      },
                    },
                  ]
            }
            onClose={() => setShowPostMenu(false)}
          />
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            title="게시글 삭제"
            message="삭제하면 복구할 수 없습니다. 삭제하시겠습니까?"
            confirmLabel="삭제"
            cancelLabel="취소"
            confirmVariant="danger"
            onConfirm={async () => {
              setShowDeleteConfirm(false)
              try {
                await deletePost(post.id)
                goBack()
              } catch {
                Alert.alert('오류', '삭제에 실패했습니다.')
              }
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </>
      )}

      <ReportModal
        isOpen={reportCommentId !== null}
        targetType="COMMENT"
        targetId={reportCommentId}
        onClose={() => setReportCommentId(null)}
      />

      <ReportModal
        isOpen={showPostReport}
        targetType="POST"
        targetId={post?.id ?? null}
        onClose={() => setShowPostReport(false)}
      />

      <ReportModal
        isOpen={showPostAlreadyReported}
        targetType="POST"
        targetId={post?.id ?? null}
        onClose={() => setShowPostAlreadyReported(false)}
        presetAlreadyReported
      />
    </>
  )
}

