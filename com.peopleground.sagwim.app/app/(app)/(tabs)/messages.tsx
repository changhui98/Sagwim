import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, router, useFocusEffect } from 'expo-router'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../../../src/context/AuthContext'
import { fetchRooms } from '../../../src/api/chatApi'
import { useRoomsLiveUpdate } from '../../../src/hooks/useChatSocket'
import { resolveImageUrl } from '../../../src/lib/resolveImageUrl'
import { fontSize, spacing } from '../../../src/constants/theme'
import { useTheme } from '../../../src/context/ThemeContext'
import type { ChatRoomSummary } from '../../../src/types/chat'

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('ko-KR', { weekday: 'short' })
  }
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { meUsername } = useAuth()

  const [rooms, setRooms] = useState<ChatRoomSummary[]>([])
  const [loading, setLoading] = useState(true)

  const loadRooms = useCallback(async () => {
    try {
      const res = await fetchRooms()
      setRooms(res.content)
    } catch {
      // 조용히 실패 — 기존 목록 유지
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void loadRooms()
    }, [loadRooms]),
  )

  // 실시간 방 목록 갱신 (마지막 메시지/시간/unread)
  useRoomsLiveUpdate({
    rooms,
    activeRoomId: null,
    myUsername: meUsername ?? '',
    setRooms,
  })

  const handleRoomPress = useCallback((room: ChatRoomSummary) => {
    router.push({
      pathname: '/(app)/chat-room',
      params: {
        roomId: String(room.roomId),
        partnerUsername: room.partnerUsername,
        partnerNickname: room.partnerNickname,
        partnerProfileImageUrl: room.partnerProfileImageUrl ?? '',
      },
    })
  }, [])

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sp10 },
    emptyText: { fontSize: fontSize.base, color: colors.textMuted },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
      gap: spacing.sp3,
    },
    itemPressed: { backgroundColor: colors.surface2 },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface2 },
    avatarFallback: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: { fontSize: fontSize.lg, fontWeight: '700', color: colors.accent },
    info: { flex: 1, gap: 2 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    partnerName: { fontSize: fontSize.base, fontWeight: '600', color: colors.text, flexShrink: 1 },
    time: { fontSize: fontSize.xs, color: colors.textMuted, marginLeft: spacing.sp2 },
    lastMessage: { fontSize: fontSize.sm, color: colors.textMuted },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    unreadText: { fontSize: fontSize.xs, fontWeight: '700', color: '#fff' },
    separator: { height: 1, backgroundColor: colors.border, marginLeft: 68 },
  }), [colors])

  const renderItem = ({ item }: { item: ChatRoomSummary }) => {
    const avatarUri = resolveImageUrl(item.partnerProfileImageUrl)
    return (
      <Pressable
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        onPress={() => handleRoomPress(item)}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{item.partnerNickname.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={styles.partnerName} numberOfLines={1}>{item.partnerNickname}</Text>
            <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessageContent ?? '대화를 시작해보세요.'}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
          </View>
        )}
      </Pressable>
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>메시지</Text>
        </View>

        {loading && rooms.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => String(item.roomId)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <View style={styles.center}>
                <Text style={styles.emptyText}>대화가 없습니다.</Text>
              </View>
            )}
            contentContainerStyle={rooms.length === 0 ? { flexGrow: 1 } : { paddingBottom: insets.bottom + spacing.sp8 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  )
}
