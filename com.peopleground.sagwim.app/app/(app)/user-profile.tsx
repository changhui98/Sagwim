import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getUserProfile } from '../../src/api/userApi'
import { getUserPosts } from '../../src/api/postApi'
import { createDirectRoom } from '../../src/api/chatApi'
import { PostCard } from '../../src/components/PostCard'
import { resolveImageUrl } from '../../src/lib/resolveImageUrl'
import { fontSize, radius, spacing } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'
import { useAuth } from '../../src/context/AuthContext'
import type { ContentResponse } from '../../src/types/post'
import type { UserDetailResponse } from '../../src/types/user'

type ViewMode = 'photo' | 'text'

type PhotoRowItem = { type: 'photo-row'; items: ContentResponse[] }
type TextPostItem = { type: 'text-post'; post: ContentResponse }
type ListItemData = PhotoRowItem | TextPostItem

const GRID_COLUMNS = 3
const GRID_GAP = 1

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { colors } = useTheme()
  const { meUsername } = useAuth()
  const { username } = useLocalSearchParams<{ username: string }>()
  const isMe = !!username && username === meUsername
  const [messaging, setMessaging] = useState(false)

  const cellSize = (screenWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS

  const [profile, setProfile] = useState<UserDetailResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('photo')
  const [posts, setPosts] = useState<ContentResponse[]>([])
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const isFirstLoad = useRef(true)

  const photoPosts = useMemo(
    () => posts.filter((p) => (p.imageUrls?.length ?? 0) > 0),
    [posts],
  )
  const textPosts = useMemo(
    () => posts.filter((p) => (p.imageUrls?.length ?? 0) === 0),
    [posts],
  )

  const listData = useMemo((): ListItemData[] => {
    if (viewMode === 'photo') {
      const rows: ListItemData[] = []
      for (let i = 0; i < photoPosts.length; i += GRID_COLUMNS) {
        rows.push({ type: 'photo-row', items: photoPosts.slice(i, i + GRID_COLUMNS) })
      }
      return rows
    }
    return textPosts.map((post) => ({ type: 'text-post', post }))
  }, [viewMode, photoPosts, textPosts])

  const fetchPosts = useCallback(
    async (nextPage: number, replace = false) => {
      if (!username || isLoadingRef.current) return
      isLoadingRef.current = true
      setIsLoading(true)
      try {
        const result = await getUserPosts(username, nextPage, 12)
        setPosts((prev) => {
          if (replace) return result.content
          const existingIds = new Set(prev.map((p) => p.id))
          return [...prev, ...result.content.filter((p) => !existingIds.has(p.id))]
        })
        setPage(result.page)
        setHasNext(result.hasNext)
      } catch {
        // 조용히 실패
      } finally {
        isLoadingRef.current = false
        setIsLoading(false)
      }
    },
    [username],
  )

  useEffect(() => {
    if (!isFirstLoad.current || !username) return
    isFirstLoad.current = false
    void (async () => {
      setProfileLoading(true)
      try {
        const [profileRes] = await Promise.all([
          getUserProfile(username),
          fetchPosts(0, true),
        ])
        setProfile(profileRes)
      } catch {
        // 프로필 조회 실패 — null 유지
      } finally {
        setProfileLoading(false)
      }
    })()
  }, [username, fetchPosts])

  const handleLoadMore = () => {
    if (!hasNext || isLoading) return
    void fetchPosts(page + 1)
  }

  const handleMessage = async () => {
    if (!profile || messaging) return
    setMessaging(true)
    try {
      const room = await createDirectRoom(profile.id)
      router.push({
        pathname: '/(app)/chat-room',
        params: {
          roomId: String(room.roomId),
          partnerUsername: profile.username,
          partnerNickname: profile.nickname,
          partnerProfileImageUrl: profile.profileImageUrl ?? '',
        },
      })
    } catch {
      // 무시 (이미 방이 존재하면 백엔드가 기존 방을 반환)
    } finally {
      setMessaging(false)
    }
  }

  const displayNickname = profile?.nickname ?? username ?? '사용자'
  const avatarUri = resolveImageUrl(profile?.profileImageUrl)
  const avatarInitial = displayNickname.charAt(0).toUpperCase()

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
    headerBackBtn: { padding: 4 },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.text,
      marginRight: 28,
    },
    profileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sp4,
      paddingHorizontal: spacing.sp4,
      paddingTop: spacing.sp4,
      paddingBottom: spacing.sp3,
    },
    avatar: { width: 72, height: 72, borderRadius: 36 },
    avatarFallback: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: { fontSize: fontSize.xl2, fontWeight: '700', color: colors.accent },
    profileInfo: { flex: 1, gap: spacing.sp1 },
    nickname: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
    bio: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 18 },
    messageButton: {
      marginHorizontal: spacing.sp4,
      marginBottom: spacing.sp3,
      paddingVertical: spacing.sp2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    messageButtonPressed: { backgroundColor: colors.surface2 },
    messageButtonText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
    tabRow: { flexDirection: 'row' },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sp3 },
    gridRow: { flexDirection: 'row' },
    cell: { overflow: 'hidden', backgroundColor: colors.surface2 },
    multiImageBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: 'rgba(0,0,0,0.45)',
      borderRadius: 4,
      padding: 2,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sp16,
      gap: spacing.sp3,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: spacing.sp8,
    },
    footerLoader: { paddingVertical: spacing.sp4, alignItems: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  }), [colors])

  const renderHeader = () => (
    <View>
      <View style={styles.profileSection}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{avatarInitial}</Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>{displayNickname}</Text>
          {!!profile?.bio && (
            <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
          )}
        </View>
      </View>

      {!isMe && !!profile && (
        <Pressable
          style={({ pressed }) => [styles.messageButton, pressed && styles.messageButtonPressed]}
          onPress={handleMessage}
          disabled={messaging}
        >
          <Text style={styles.messageButtonText}>
            {messaging ? '연결 중...' : '메시지 보내기'}
          </Text>
        </Pressable>
      )}

      <View style={styles.tabRow}>
        <Pressable
          style={styles.tabItem}
          onPress={() => setViewMode('photo')}
          accessibilityRole="tab"
          accessibilityLabel="사진 게시글 보기"
        >
          <Ionicons
            name="image-outline"
            size={22}
            color={viewMode === 'photo' ? colors.text : colors.textMuted}
          />
        </Pressable>
        <Pressable
          style={styles.tabItem}
          onPress={() => setViewMode('text')}
          accessibilityRole="tab"
          accessibilityLabel="글 보기"
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={viewMode === 'text' ? colors.text : colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  )

  const renderListItem = ({ item }: { item: ListItemData }) => {
    if (item.type === 'photo-row') {
      return (
        <View style={styles.gridRow}>
          {item.items.map((post, colIndex) => {
            const imageUri = resolveImageUrl(post.imageUrls?.[0])
            return (
              <Pressable
                key={`photo-${post.id}`}
                style={[
                  styles.cell,
                  { width: cellSize, height: cellSize },
                  colIndex < GRID_COLUMNS - 1 && { marginRight: GRID_GAP },
                  { marginBottom: GRID_GAP },
                ]}
                onPress={() =>
                  router.push({ pathname: '/(app)/post-detail', params: { id: String(post.id) } })
                }
                accessibilityRole="button"
              >
                {imageUri && (
                  <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                )}
                {(post.imageUrls?.length ?? 0) > 1 && (
                  <View style={styles.multiImageBadge}>
                    <Ionicons name="copy-outline" size={12} color="#fff" />
                  </View>
                )}
              </Pressable>
            )
          })}
          {item.items.length < GRID_COLUMNS &&
            Array.from({ length: GRID_COLUMNS - item.items.length }).map((_, i) => (
              <View
                key={`filler-${i}`}
                style={[
                  styles.cell,
                  { width: cellSize, height: cellSize, backgroundColor: colors.bg },
                  i < GRID_COLUMNS - item.items.length - 1 && { marginRight: GRID_GAP },
                ]}
              />
            ))}
        </View>
      )
    }
    return <PostCard post={item.post} />
  }

  const renderEmpty = () => {
    if (isLoading) return null
    const msg = viewMode === 'photo' ? '사진 게시글이 없어요.' : '글이 없어요.'
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={viewMode === 'photo' ? 'image-outline' : 'document-text-outline'}
          size={48}
          color={colors.textMuted}
        />
        <Text style={styles.emptyText}>{msg}</Text>
      </View>
    )
  }

  const renderFooter = () => {
    if (!isLoading) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.textMuted} />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.headerBackBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{displayNickname}</Text>
        </View>

        {profileLoading && posts.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            key={viewMode}
            data={listData}
            keyExtractor={(item, index) =>
              item.type === 'photo-row' ? `row-${index}` : `post-${item.post.id}`
            }
            renderItem={renderListItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.sp8 }}
          />
        )}
      </View>
    </>
  )
}
