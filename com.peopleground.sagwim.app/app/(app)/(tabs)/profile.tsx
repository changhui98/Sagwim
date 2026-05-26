import React, { useCallback, useEffect, useState } from 'react'
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
import type { ContentResponse } from '../../../src/types/post'
import { resolveImageUrl } from '../../../src/lib/resolveImageUrl'
import { colors, fontSize, radius, spacing } from '../../../src/constants/theme'

const GRID_COLUMNS = 3
const GRID_GAP = 1

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { meUsername, meNickname, meProfileImageUrl, logout } = useAuth()

  const cellSize = (screenWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS

  const [posts, setPosts] = useState<ContentResponse[]>([])
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchPosts = useCallback(
    async (nextPage: number, refresh = false) => {
      if (!meUsername) return
      if (isLoading) return

      setIsLoading(true)
      try {
        const result = await getUserPosts(meUsername, nextPage, 12)
        setPosts((prev) => (refresh ? result.content : [...prev, ...result.content]))
        setPage(result.page)
        setHasNext(result.hasNext)
      } catch {
        // 조용히 실패 — 빈 상태 유지
      } finally {
        setIsLoading(false)
      }
    },
    [meUsername, isLoading],
  )

  useEffect(() => {
    if (meUsername) {
      fetchPosts(0, true)
    }
    // fetchPosts 는 isLoading 의존성이 있어 무한 루프 방지를 위해 의도적으로 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meUsername])

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
    fetchPosts(page + 1)
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

  const handleEditProfile = () => {
    Alert.alert('준비 중', '프로필 편집 기능을 준비 중이에요.')
  }

  const avatarUri = resolveImageUrl(meProfileImageUrl)
  const displayNickname = meNickname ?? meUsername ?? '사용자'
  const avatarInitial = displayNickname.charAt(0).toUpperCase()

  const renderCell = ({ item, index }: { item: ContentResponse; index: number }) => {
    const firstImage = item.imageUrls?.[0]
    const imageUri = resolveImageUrl(firstImage)
    const isLastInRow = (index + 1) % GRID_COLUMNS === 0

    return (
      <View
        style={[
          styles.cell,
          { width: cellSize, height: cellSize },
          !isLastInRow && { marginRight: GRID_GAP },
          { marginBottom: GRID_GAP },
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.textCell, { width: cellSize, height: cellSize }]}>
            <Text style={styles.textCellBody} numberOfLines={2}>
              {item.body}
            </Text>
          </View>
        )}
      </View>
    )
  }

  const renderEmpty = () => {
    if (isLoading) return null
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="image-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>게시글이 없어요.</Text>
      </View>
    )
  }

  const renderHeader = () => (
    <View>
      {/* 프로필 섹션 */}
      <View style={styles.profileSection}>
        {/* 아바타 */}
        <View style={styles.avatarWrapper}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{avatarInitial}</Text>
            </View>
          )}
        </View>

        {/* 닉네임 + 소개 */}
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>{displayNickname}</Text>
          <Text style={styles.bio} numberOfLines={2}>
            {'한 줄 소개를 작성해보세요.'}
          </Text>
        </View>
      </View>

      {/* 프로필 편집 버튼 */}
      <Pressable
        style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
        onPress={handleEditProfile}
      >
        <Text style={styles.editButtonText}>프로필 편집</Text>
      </Pressable>

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 탭 아이콘 (grid) */}
      <View style={styles.tabRow}>
        <View style={styles.tabItemActive}>
          <Ionicons name="grid-outline" size={22} color={colors.text} />
        </View>
      </View>

      {/* 탭 아래 구분선 */}
      <View style={styles.divider} />
    </View>
  )

  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null
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
        {/* 커스텀 헤더 */}
        <View style={styles.header}>
          {/* 좌측 placeholder (레이아웃 균형) */}
          <View style={styles.headerSide} />

          <Text style={styles.headerTitle}>프로필</Text>

          <View style={styles.headerSide}>
            <Pressable
              onPress={handleSettingsPress}
              hitSlop={8}
              style={styles.headerIconBtn}
            >
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* 게시글 FlatList (헤더에 프로필 섹션 포함) */}
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCell}
          numColumns={GRID_COLUMNS}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            posts.length === 0 ? styles.flatListContentEmpty : undefined
          }
          // 갭 없이 딱 붙이기 위해 columnWrapperStyle 사용하지 않음 (renderItem에서 직접 처리)
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

  // 구분선 & 탭
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    paddingVertical: spacing.sp2,
    paddingHorizontal: spacing.sp6,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },

  // FlatList
  flatList: {
    flex: 1,
  },
  flatListContentEmpty: {
    flexGrow: 1,
  },

  // 그리드 셀
  cell: {
    overflow: 'hidden',
    backgroundColor: colors.surface2,
  },
  textCell: {
    backgroundColor: colors.surface2,
    padding: spacing.sp2,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  textCellBody: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
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
  },

  // Footer loader
  footerLoader: {
    paddingVertical: spacing.sp4,
    alignItems: 'center',
  },
})
