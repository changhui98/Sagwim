import React, { useMemo, useState } from 'react'
import { Tabs, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fontSize, radius, spacing } from '../../../src/constants/theme'
import { useTheme } from '../../../src/context/ThemeContext'

const ICON_SIZE = 24
const TAB_CONTENT_HEIGHT = 44

function CreateBottomSheet({
  visible,
  onClose,
  bottomInset,
}: {
  visible: boolean
  onClose: () => void
  bottomInset: number
}) {
  const { colors } = useTheme()

  const sheet = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    card: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingTop: spacing.sp3,
      paddingHorizontal: spacing.sp4,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.sp4,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sp4,
      gap: spacing.sp3,
      borderRadius: radius.md,
    },
    itemPressed: {
      backgroundColor: colors.surface3,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    itemSubtitle: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.sp2,
    },
    cancelBtn: {
      marginTop: spacing.sp3,
      paddingVertical: spacing.sp4,
      alignItems: 'center',
      borderRadius: radius.md,
    },
    cancelBtnPressed: {
      backgroundColor: colors.surface3,
    },
    cancelText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  }), [colors])

  const handleSelect = (path: '/(app)/post-create' | '/(app)/group-create') => {
    onClose()
    setTimeout(() => router.push(path), 50)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={sheet.overlay} onPress={onClose}>
        <Pressable
          style={[sheet.card, { paddingBottom: bottomInset + spacing.sp2 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={sheet.handle} />

          <Pressable
            style={({ pressed }) => [sheet.item, pressed && sheet.itemPressed]}
            onPress={() => handleSelect('/(app)/post-create')}
            accessibilityRole="button"
          >
            <View style={sheet.iconWrap}>
              <Ionicons name="document-text-outline" size={24} color={colors.accent} />
            </View>
            <View style={sheet.textWrap}>
              <Text style={sheet.itemTitle}>게시글 작성</Text>
              <Text style={sheet.itemSubtitle}>내 이야기를 나눠보세요</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={sheet.divider} />

          <Pressable
            style={({ pressed }) => [sheet.item, pressed && sheet.itemPressed]}
            onPress={() => handleSelect('/(app)/group-create')}
            accessibilityRole="button"
          >
            <View style={sheet.iconWrap}>
              <Ionicons name="people-outline" size={24} color={colors.accent} />
            </View>
            <View style={sheet.textWrap}>
              <Text style={sheet.itemTitle}>모임 만들기</Text>
              <Text style={sheet.itemSubtitle}>새로운 모임을 시작해보세요</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [sheet.cancelBtn, pressed && sheet.cancelBtnPressed]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={sheet.cancelText}>취소</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const tabBarHeight = TAB_CONTENT_HEIGHT + insets.bottom
  const [createVisible, setCreateVisible] = useState(false)

  return (
    <>
      <CreateBottomSheet visible={createVisible} onClose={() => setCreateVisible(false)} bottomInset={insets.bottom} />
      <Tabs
      screenOptions={{
        // ─── 상단 공통 헤더 ───────────────────────────────────────
        headerShown: true,
        headerTitle: 'Sagwim',
        headerTitleStyle: {
          fontSize: 19,
          fontWeight: '300',
          color: colors.text,
        },
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerShadowVisible: false,
        headerLeft: () => (
          <Pressable
            onPress={() => setCreateVisible(true)}
            style={{ paddingLeft: 16, paddingVertical: 8 }}
            accessibilityLabel="만들기"
            accessibilityRole="button"
          >
            <Ionicons name="add-outline" size={26} color={colors.text} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => console.log('[Header] notifications — pending')}
            style={{ paddingRight: 16, paddingVertical: 8 }}
            accessibilityLabel="알림"
            accessibilityRole="button"
          >
            <Ionicons name="heart-outline" size={ICON_SIZE} color={colors.text} />
          </Pressable>
        ),

        // ─── 하단 탭바 ────────────────────────────────────────────
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 0,
        },
        tabBarIconStyle: {
          marginTop: insets.bottom / 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '검색',
          tabBarIcon: ({ color }) => (
            <Ionicons name="search-outline" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: '게시글',
          tabBarIcon: ({ color }) => (
            <Ionicons name="reader-outline" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '메시지',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-outline" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      {/* 만들기: 라우트는 유지, 탭바에서만 숨김 */}
      <Tabs.Screen
        name="create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tabs>
    </>
  )
}
