import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { deletePost, togglePostLike } from '../api/postApi'
import { ActionSheet, type ActionSheetOption } from './common/ActionSheet'
import { ConfirmDialog } from './common/ConfirmDialog'
import { ReportModal } from './common/ReportModal'
import { resolveImageUrl } from '../lib/resolveImageUrl'
import { useAuth } from '../context/AuthContext'
import { fontSize, radius, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import type { ContentResponse } from '../types/post'

export function formatRelativeTime(isoString: string): string {
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

const SCREEN_WIDTH = Dimensions.get('window').width
const IMAGE_MAX_HEIGHT = 360

function DynamicPostImage({ uri }: { uri: string }) {
  const { colors } = useTheme()
  const [height, setHeight] = useState(240)

  useEffect(() => {
    Image.getSize(
      uri,
      (w, h) => {
        if (w > 0 && h > 0) {
          const natural = (h / w) * SCREEN_WIDTH
          setHeight(Math.min(natural, IMAGE_MAX_HEIGHT))
        }
      },
      () => setHeight(240),
    )
  }, [uri])

  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', borderRadius: radius.md, backgroundColor: colors.surface3, height }}
      resizeMode="cover"
      accessibilityLabel="게시글 이미지"
    />
  )
}

interface PostCardProps {
  post: ContentResponse
  onLikeToggle?: (id: number, liked: boolean, likeCount: number) => void
  onDelete?: (id: number) => void
}

export function PostCard({ post, onLikeToggle, onDelete }: PostCardProps) {
  const { colors } = useTheme()
  const { meUsername, meProfileImageUrl } = useAuth()
  const author = post.nickname ?? post.createdBy
  const isMine = !!meUsername && post.createdBy === meUsername
  const avatarUrl = isMine ? resolveImageUrl(meProfileImageUrl) : null

  const [liked, setLiked] = useState(post.likedByMe ?? false)
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0)
  const isLikeInFlight = useRef(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showAlreadyReported, setShowAlreadyReported] = useState(false)

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
      onLikeToggle?.(post.id, res.liked, res.likeCount)
    } catch {
      setLiked(prevLiked)
      setLikeCount(prevCount)
    } finally {
      isLikeInFlight.current = false
    }
  }, [liked, likeCount, post.id, onLikeToggle])

  const goToDetail = useCallback(() => {
    router.push({ pathname: '/(app)/post-detail', params: { id: String(post.id) } })
  }, [post.id])

  const menuOptions: ActionSheetOption[] = isMine
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
            if (post.reportedByMe) setShowAlreadyReported(true)
            else setShowReport(true)
          },
        },
      ]

  const styles = useMemo(() => StyleSheet.create({
    card: { backgroundColor: colors.bg, paddingHorizontal: spacing.sp4, paddingVertical: spacing.sp4, gap: spacing.sp3 },
    cardPressed: { backgroundColor: colors.surface2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sp3 },
    avatar: {
      width: 40, height: 40, borderRadius: radius.full,
      backgroundColor: colors.accentMuted,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    avatarText: { fontSize: fontSize.md, fontWeight: '700', color: colors.accent },
    authorWrap: { flex: 1, gap: 2 },
    author: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
    time: { fontSize: fontSize.sm, color: colors.textMuted },
    moreBtn: { padding: 4 },
    body: { fontSize: fontSize.md, color: colors.text, lineHeight: fontSize.md * 1.55 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sp2 },
    tag: { backgroundColor: colors.accentMuted, paddingHorizontal: spacing.sp2, paddingVertical: 3, borderRadius: radius.sm },
    tagText: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '500' },
    footer: { flexDirection: 'row', gap: spacing.sp4 },
    footerButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sp1 },
    footerCount: { fontSize: fontSize.base, color: colors.textMuted },
    footerCountActive: { color: colors.error },
  }), [colors])

  return (
    <>
    <Pressable
      onPress={goToDetail}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${author}의 게시글`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>{author.slice(0, 1).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.authorWrap}>
          <Text style={styles.author}>{author}</Text>
          <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
        <Pressable onPress={() => setShowMenu(true)} hitSlop={8} style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.body} numberOfLines={3}>{post.body}</Text>

      {(post.imageUrls?.length ?? 0) > 0 && (() => {
        const uri = resolveImageUrl(post.imageUrls![0])
        return uri ? <DynamicPostImage uri={uri} /> : null
      })()}

      {(post.tags?.length ?? 0) > 0 && (
        <View style={styles.tags}>
          {post.tags!.map((tag, i) => (
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

    <ActionSheet
      isOpen={showMenu}
      options={menuOptions}
      onClose={() => setShowMenu(false)}
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
          onDelete?.(post.id)
        } catch {
          Alert.alert('오류', '삭제에 실패했습니다.')
        }
      }}
      onCancel={() => setShowDeleteConfirm(false)}
    />

    <ReportModal
      isOpen={showReport}
      targetType="POST"
      targetId={post.id}
      onClose={() => setShowReport(false)}
    />

    <ReportModal
      isOpen={showAlreadyReported}
      targetType="POST"
      targetId={post.id}
      onClose={() => setShowAlreadyReported(false)}
      presetAlreadyReported
    />
  </>
  )
}

