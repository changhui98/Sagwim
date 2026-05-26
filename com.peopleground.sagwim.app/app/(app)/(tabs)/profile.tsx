import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { Stack, router } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../../../src/context/AuthContext'
import { getUserPosts } from '../../../src/api/postApi'
import { PostCard } from '../../../src/components/PostCard'
import type { ContentResponse } from '../../../src/types/post'
import { resolveImageUrl } from '../../../src/lib/resolveImageUrl'
import { colors, fontSize, radius, spacing } from '../../../src/constants/theme'

type ViewMode = 'photo' | 'text'

const GRID_COLUMNS = 3
const GRID_GAP = 1

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { meUsername, meNickname, meProfileImageUrl, logout } = useAuth()

  const cellSize = (screenWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS

  const [viewMode, setViewMode] = useState<ViewMode>('photo')
  const [posts, setPosts] = useState<ContentResponse[]>([])
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 웹과 동일하게 이미지 유무로 분리
  const photoPosts = useMemo(
    () => posts.filter((p) => (p.imageUrls?.length ?? 0) > 0),
    [posts],
  )
  const textPosts = useMemo(
    () => posts.filter((p) => (p.imageUrls?.length ?? 0) === 0),
    [posts],
  )
  const visiblePosts = viewMode === 'photo' ? photoPosts : textPosts

  const fetchPosts = useCallback(
    async (nextPage: number, refresh = false) => {
      if (!meUsername || isLoading) return
      setIsLoading(true)
      try {
        const result = await getUserPosts(meUsername, nextPage, 12)
        setPosts((prev) => (refresh ? result.content : [...prev, ...result.content]))
        setPage(result.page)
        setHasNext(result.hasNext)
      } catch {
        // 조용히 실패
      } finally {
        setIsLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meUsername],
  )

  useEffect(() => {
    if (meUsername) void fetchPosts(0, true)
  }, [meUsername]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    if (!meUsername) return
    setIsRefreshing(true)
    try {
      const result = await getUserPosts(meUsername, 0, 12)
      setPosts(result.content)
      setPage(result.page)
      setHasNext(result.hasNext)
    } catch {
      // 무시
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLoadMore = () => {
    if (!hasNext || isLoading) return
    void fetchPosts(page + 1)
  }

  const handleSettingsPress = () => {
    Alert.alert('설정', undefined, [
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/(auth)/login')
        },
      },
      { text: '취소', style: 'cancel' },
    ])
  }

  const avatarUri = resolveImageUrl(meProfileImageUrl)
  const displayNickname = meNickname ?? meUsername ?? '사용자'
  const avatarInitial = displayNickname.charAt(0).toUpperCase()

  // ── 그리드 셀 (사진 탭) ──
  const renderPhotoCell = ({ item, index }: { item: ContentResponse; index: number }) => {
    const imageUri = resolveImageUrl(item.imageUrls?.[0])
    const isLastInRow = (index + 1) % GRID_COLUMNS === 0
    return (
      <Pressable
        style={[
          styles.cell,
          { width: cellSize, height: cellSize },
          !isLastInRow && { marginRight: GRID_GAP },
          { marginBottom: GRID_GAP },
        ]}
        onPress={() => router.push({ pathname: '/(app)/post-detail', params: { id: String(item.id) } })}
        accessibilityRole="button"
      >
        {imageUri && (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        )}
        {(item.imageUrls?.length ?? 0) > 1 && (
          <View style={styles.multiImageBadge}>
            <Ionicons name="copy-outline" size={12} color="#fff" />
          </View>
        )}
      </Pressable>
    )
  }

  // ── 텍스트 행 (글 탭) — 공통 PostCard 재사용 ──
  const renderTextRow = ({ item }: { item: ContentResponse }) => (
    <PostCard post={item} />
  )

  const renderEmpty = () => {
    if (isLoading) return null
    const msg =
      viewMode === 'photo'
        ? '첫 사진을 공유해 목록을 채워보세요.'
        : '사진이 없는 글만 보여드려요. 아직 없어요.'
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
    if (!isLoading || isRefreshing) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.textMuted} />
      </View>
    )
  }

  const renderHeader = () => (
    <View>
      {/* 프로필 섹션 */}
      <View style={styles.profileSection}>
        <View style={styles.avatarWrapper}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{avatarInitial}</Text>
            </View>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>{displayNickname}</Text>
          <Text style={styles.bio} numberOfLines={2}>
            한 줄 소개를 작성해보세요.
          </Text>
        </View>
      </View>

      {/* 프로필 편집 버튼 */}
      <Pressable
        style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
        onPress={() => Alert.alert('준비 중', '프로필 편집 기능을 준비 중이에요.')}
      >
        <Text style={styles.editButtonText}>프로필 편집</Text>
      </Pressable>

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 탭 토글 (사진 / 글) */}
      <View style={styles.tabRow}>
        {/* 사진 탭 */}
        <Pressable
          style={[styles.tabItem, viewMode === 'photo' && styles.tabItemActive]}
          onPress={() => setViewMode('photo')}
          accessibilityRole="tab"
          accessibilityLabel="사진 게시글 보기"
        >
          {/* 웹과 동일한 이미지+풍경 아이콘 (SVG 대신 Ionicons 근사치) */}
          <Ionicons
            name="image-outline"
            size={22}
            color={viewMode === 'photo' ? colors.text : colors.textMuted}
          />
        </Pressable>

        {/* 글 탭 */}
        <Pressable
          style={[styles.tabItem, viewMode === 'text' && styles.tabItemActive]}
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

      <View style={styles.divider} />
    </View>
  )

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 커스텀 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle}>프로필</Text>
          <View style={styles.headerSide}>
            <Pressable onPress={handleSettingsPress} hitSlop={8} style={styles.headerIconBtn}>
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* key={viewMode} → numColumns 변경 시 FlatList 재마운트 */}
        <FlatList
          key={viewMode}
          data={visiblePosts}
          keyExtractor={(item) => String(item.id)}
          renderItem={viewMode === 'photo' ? renderPhotoCell : renderTextRow}
          numColumns={viewMode === 'photo' ? GRID_COLUMNS : 1}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={visiblePosts.length === 0 ? styles.flatListContentEmpty : undefined}
          style={styles.flatList}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  headerIconBtn: {
    padding: 4,
  },

  // 프로필 섹션
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp4,
    paddingHorizontal: spacing.sp4,
    paddingTop: spacing.sp4,
    paddingBottom: spacing.sp3,
  },
  avatarWrapper: {
    flexShrink: 0,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarFallback: {
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: fontSize.xl2,
    fontWeight: '700',
    color: colors.accent,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.sp1,
  },
  nickname: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  bio: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },

  // 프로필 편집 버튼
  editButton: {
    marginHorizontal: spacing.sp4,
    marginVertical: spacing.sp3,
    paddingVertical: spacing.sp2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  editButtonPressed: {
    backgroundColor: colors.surface2,
  },
  editButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },

  // 구분선
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // 탭 토글
  tabRow: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sp3,
  },
  tabItemActive: {},

  // FlatList
  flatList: {
    flex: 1,
  },
  flatListContentEmpty: {
    flexGrow: 1,
  },

  // 사진 그리드 셀
  cell: {
    overflow: 'hidden',
    backgroundColor: colors.surface2,
  },
  multiImageBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 4,
    padding: 2,
  },

  // Empty state
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

  // Footer loader
  footerLoader: {
    paddingVertical: spacing.sp4,
    alignItems: 'center',
  },
})
