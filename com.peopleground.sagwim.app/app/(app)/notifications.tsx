import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../src/context/ThemeContext'
import { useNotificationCount } from '../../src/context/NotificationCountContext'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../src/api/notificationApi'
import type { NotificationResponse, NotificationType } from '../../src/types/notification'
import { fontSize, radius, spacing } from '../../src/constants/theme'

const PAGE_SIZE = 20

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

function getNotificationMessage(item: NotificationResponse): string {
  switch (item.type) {
    case 'CONTENT_LIKED':
      return `${item.actorNickname}님이 회원님의 게시글을 좋아합니다.`
    case 'COMMENT_LIKED':
      return `${item.actorNickname}님이 회원님의 댓글을 좋아합니다.`
    case 'COMMENT_ADDED':
      return `${item.actorNickname}님이 회원님의 게시글에 댓글을 남겼습니다.`
    case 'MEETING_MEMBER_JOINED':
      return `${item.actorNickname}님이 모임에 가입했습니다.`
    case 'MEETING_SCHEDULE_ADDED':
      return `${item.targetTitle ?? '모임'} 모임에 새 일정이 등록됐습니다.`
  }
}

function navigateForNotification(type: NotificationType, targetId: number | null) {
  if (targetId === null) return

  if (
    type === 'CONTENT_LIKED' ||
    type === 'COMMENT_LIKED' ||
    type === 'COMMENT_ADDED'
  ) {
    router.push({ pathname: '/(app)/post-detail', params: { id: String(targetId) } })
  } else {
    router.push({ pathname: '/(app)/group-detail', params: { id: String(targetId) } })
  }
}

interface NotificationItemProps {
  item: NotificationResponse
  onPress: (item: NotificationResponse) => void
  colors: ReturnType<typeof useTheme>['colors']
  styles: ReturnType<typeof StyleSheet.create>
}

function NotificationItem({ item, onPress, colors, styles }: NotificationItemProps) {
  const initial = item.actorNickname.slice(0, 1).toUpperCase()

  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        !item.read && styles.itemUnread,
        pressed && styles.itemPressed,
      ]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={getNotificationMessage(item)}
    >
      {/* 아바타 */}
      <View style={styles.avatar}>
        {item.actorProfileImageUrl ? (
          <Image
            source={{ uri: item.actorProfileImageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.avatarText}>{initial}</Text>
        )}
      </View>

      {/* 메시지 + 시간 */}
      <View style={styles.content}>
        <Text style={styles.message} numberOfLines={2}>
          {getNotificationMessage(item)}
        </Text>
        <Text style={styles.time}>{formatRelativeTime(item.createdDate)}</Text>
      </View>

      {/* 미읽음 도트 */}
      {!item.read && <View style={styles.dot} />}
    </Pressable>
  )
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { refreshUnreadCount } = useNotificationCount()

  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchingMore, setFetchingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const isFirstLoad = useRef(true)

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerSide: { width: 72 },
    headerBack: { fontSize: fontSize.base, color: colors.text },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    headerReadAll: {
      fontSize: fontSize.sm,
      color: colors.accent,
      textAlign: 'right',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sp3,
    },
    emptyText: { fontSize: fontSize.base, color: colors.textMuted },
    separator: { height: 1, backgroundColor: colors.border },
    footer: { alignItems: 'center', paddingVertical: spacing.sp4 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
      gap: spacing.sp3,
      backgroundColor: colors.bg,
    },
    itemUnread: {
      backgroundColor: colors.accentMuted,
    },
    itemPressed: {
      opacity: 0.75,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    },
    avatarText: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.accent,
    },
    content: {
      flex: 1,
      gap: 3,
    },
    message: {
      fontSize: fontSize.base,
      color: colors.text,
      lineHeight: fontSize.base * 1.5,
    },
    time: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.error,
      flexShrink: 0,
    },
  }), [colors])

  const loadPage = useCallback(async (pageNum: number, replace: boolean) => {
    try {
      const res = await getNotifications(pageNum, PAGE_SIZE)
      setNotifications((prev) => replace ? res.content : [...prev, ...res.content])
      setHasNext(res.hasNext)
      setPage(pageNum)
    } catch {
      // 조용히 실패 — 기존 목록 유지
    }
  }, [])

  useEffect(() => {
    if (!isFirstLoad.current) return
    isFirstLoad.current = false
    void (async () => {
      setLoading(true)
      await loadPage(0, true)
      setLoading(false)
    })()
  }, [loadPage])

  const handleLoadMore = useCallback(async () => {
    if (fetchingMore || !hasNext) return
    setFetchingMore(true)
    await loadPage(page + 1, false)
    setFetchingMore(false)
  }, [fetchingMore, hasNext, page, loadPage])

  const handleItemPress = useCallback(async (item: NotificationResponse) => {
    if (!item.read) {
      try {
        await markNotificationAsRead(item.id)
        setNotifications((prev) =>
          prev.map((n) => n.id === item.id ? { ...n, read: true } : n)
        )
        void refreshUnreadCount()
      } catch {
        // 읽음 처리 실패해도 이동은 진행
      }
    }
    navigateForNotification(item.type, item.targetId)
  }, [refreshUnreadCount])

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      void refreshUnreadCount()
    } catch {
      // 조용히 실패
    }
  }, [refreshUnreadCount])

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Pressable style={styles.headerSide} onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>알림</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.headerSide} onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>알림</Text>
          <Pressable
            style={styles.headerSide}
            onPress={() => void handleMarkAllRead()}
            hitSlop={8}
            accessibilityLabel="모두 읽음"
            accessibilityRole="button"
          >
            <Text style={styles.headerReadAll}>모두 읽음</Text>
          </Pressable>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={handleItemPress}
              colors={colors}
              styles={styles}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={styles.emptyText}>새로운 알림이 없습니다.</Text>
            </View>
          )}
          ListFooterComponent={
            fetchingMore
              ? <View style={styles.footer}><ActivityIndicator color={colors.accent} /></View>
              : null
          }
          onEndReached={() => void handleLoadMore()}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.sp8, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  )
}
