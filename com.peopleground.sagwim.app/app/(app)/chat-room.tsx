import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../../src/context/AuthContext'
import { fetchMessages, markAsRead } from '../../src/api/chatApi'
import { useChatRoom } from '../../src/hooks/useChatSocket'
import { chatSocket } from '../../src/lib/chatSocket'
import { fontSize, radius, spacing } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'
import type { ChatMessage } from '../../src/types/chat'

// 낙관적 메시지 임시 id (음수 → 서버 발급 양수 id 와 충돌 없음)
let optimisticIdCounter = -1

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { meUsername } = useAuth()
  const params = useLocalSearchParams<{
    roomId: string
    partnerNickname?: string
    partnerProfileImageUrl?: string
  }>()
  const roomId = Number(params.roomId)
  const partnerNickname = params.partnerNickname ?? '대화'
  const myUsername = meUsername ?? ''

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')

  const loadMessages = useCallback(
    async (nextCursor?: number) => {
      // Number(params.roomId) 가 NaN/-1/0 인 비정상 진입(딥링크 등)을 모두 차단한다.
      if (!Number.isFinite(roomId) || roomId <= 0) return
      setLoading(true)
      try {
        const res = await fetchMessages(roomId, nextCursor)
        setMessages((prev) => (nextCursor ? [...prev, ...res.content] : res.content))
        setHasNext(res.hasNext)
        if (res.content.length > 0) {
          setCursor(res.content[res.content.length - 1].id)
        }
      } catch {
        // 에러 무시
      } finally {
        setLoading(false)
      }
    },
    [roomId],
  )

  useEffect(() => {
    setMessages([])
    setCursor(undefined)
    setHasNext(false)
    void loadMessages()
  }, [loadMessages])

  // 읽음 처리: 낙관적 메시지(음수 id)는 건너뛴다.
  useEffect(() => {
    if (!Number.isFinite(roomId) || roomId <= 0 || messages.length === 0) return
    const lastId = messages[0].id
    if (lastId <= 0) return
    void markAsRead(roomId, lastId).catch(() => null)
  }, [roomId, messages])

  // 실시간 수신: 내가 보낸 echo 면 낙관적 메시지를 교체, 아니면 맨 앞에 추가
  useChatRoom({
    roomId,
    onMessage: (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        const optimisticIdx = prev.findIndex(
          (m) => m.id < 0 && m.senderUsername === msg.senderUsername && m.content === msg.content,
        )
        if (optimisticIdx !== -1) {
          const next = [...prev]
          next[optimisticIdx] = msg
          return next
        }
        return [msg, ...prev]
      })
    },
  })

  const handleSend = () => {
    const content = draft.trim()
    if (!content) return
    // roomId 가 유효하지 않으면 전송하지 않는다(비정상 진입 방어).
    if (!Number.isFinite(roomId) || roomId <= 0) return
    const tempId = optimisticIdCounter--
    const optimistic: ChatMessage = {
      id: tempId,
      roomId,
      senderUsername: myUsername,
      senderNickname: myUsername,
      senderProfileImageUrl: null,
      content,
      type: 'TEXT',
      createdDate: new Date().toISOString(),
    }
    setMessages((prev) => [optimistic, ...prev])
    chatSocket.sendMessage({ roomId, content })
    setDraft('')
  }

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sp2,
      paddingVertical: spacing.sp3,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerBackBtn: { padding: 4 },
    headerTitle: { flex: 1, fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginRight: 28, textAlign: 'center' },
    list: { flex: 1 },
    rowMine: { alignItems: 'flex-end', paddingHorizontal: spacing.sp4, paddingVertical: 2 },
    rowTheirs: { alignItems: 'flex-start', paddingHorizontal: spacing.sp4, paddingVertical: 2 },
    bubbleMine: {
      maxWidth: '78%',
      backgroundColor: colors.accent,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.sp3,
      paddingVertical: spacing.sp2,
    },
    bubbleTheirs: {
      maxWidth: '78%',
      backgroundColor: colors.surface2,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.sp3,
      paddingVertical: spacing.sp2,
    },
    bubbleTextMine: { fontSize: fontSize.base, color: colors.onAccent },
    bubbleTextTheirs: { fontSize: fontSize.base, color: colors.text },
    time: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, marginHorizontal: spacing.sp1 },
    loadMore: { alignItems: 'center', paddingVertical: spacing.sp3 },
    loadMoreText: { fontSize: fontSize.sm, color: colors.textMuted },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.sp3,
      paddingTop: spacing.sp2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sp2,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: 40,
      backgroundColor: colors.surface2,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.sp3,
      paddingTop: spacing.sp2,
      paddingBottom: spacing.sp2,
      fontSize: fontSize.base,
      color: colors.text,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
    },
    sendBtnDisabled: { backgroundColor: colors.surface2 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    // inverted FlatList 는 콘텐츠를 상하 반전(scaleY -1)하므로, 빈 컴포넌트를 다시 반전해 정상 표시한다.
    emptyInverted: { flex: 1, alignItems: 'center', justifyContent: 'center', transform: [{ scaleY: -1 }] },
    emptyText: { fontSize: fontSize.base, color: colors.textMuted },
  }), [colors])

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMine = item.senderUsername === myUsername
    // 배열은 [최신(0) ... 과거], inverted 렌더이므로 index-1 이 화면상 바로 아래(더 최신)
    const newer = messages[index - 1]
    const sameSenderMinute =
      newer !== undefined &&
      newer.senderUsername === item.senderUsername &&
      new Date(newer.createdDate).getHours() === new Date(item.createdDate).getHours() &&
      new Date(newer.createdDate).getMinutes() === new Date(item.createdDate).getMinutes()
    const showTime = !sameSenderMinute

    return (
      <View style={isMine ? styles.rowMine : styles.rowTheirs}>
        <View style={isMine ? styles.bubbleMine : styles.bubbleTheirs}>
          <Text style={isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.content}</Text>
        </View>
        {showTime && <Text style={styles.time}>{formatTime(item.createdDate)}</Text>}
      </View>
    )
  }

  const canSend = draft.trim().length > 0

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.headerBackBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{partnerNickname}</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top + 44}
        >
          {loading && messages.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <FlatList
              style={styles.list}
              data={messages}
              inverted
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              onEndReached={() => { if (hasNext && !loading) void loadMessages(cursor) }}
              onEndReachedThreshold={0.3}
              ListEmptyComponent={() => (
                <View style={styles.emptyInverted}>
                  <Text style={styles.emptyText}>대화를 시작해보세요.</Text>
                </View>
              )}
              contentContainerStyle={messages.length === 0 ? { flexGrow: 1 } : { paddingVertical: spacing.sp3 }}
              ListFooterComponent={
                hasNext && loading ? (
                  <View style={styles.loadMore}><ActivityIndicator size="small" color={colors.textMuted} /></View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}

          <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sp2 }]}>
            <TextInput
              style={styles.input}
              placeholder="메시지 입력"
              placeholderTextColor={colors.textMuted}
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!canSend}
            >
              <Ionicons name="arrow-up" size={20} color={canSend ? '#fff' : colors.textMuted} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  )
}
