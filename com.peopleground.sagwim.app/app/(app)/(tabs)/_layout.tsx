/**
 * 하단 탭 네비게이션 (홈 / 검색 / 게시글 / 프로필).
 *
 * - 웹의 사이드바 네비게이션을 모바일 하단 탭으로 이식.
 * - 탭바: useSafeAreaInsets.bottom 으로 home indicator 영역 확보.
 * - 상단 공통 헤더:
 *   · 가운데: "Sagwim" 타이틀
 *   · 왼쪽: 만들기 아이콘 → /(app)/(tabs)/create
 *   · 오른쪽: 알림 아이콘 (placeholder)
 * - 만들기 탭: 라우트는 유지하되 href: null 로 탭바에서 숨김.
 */

import { Tabs, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../../src/constants/theme'

const ICON_SIZE = 24
const TAB_CONTENT_HEIGHT = 44 // 아이콘 전용 영역 고정 높이 (라벨 제거 후 축소)

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const tabBarHeight = TAB_CONTENT_HEIGHT + insets.bottom

  return (
    <Tabs
      screenOptions={{
        // ─── 상단 공통 헤더 ───────────────────────────────────────
        headerShown: true,
        headerTitle: 'Sagwim',
        headerTitleStyle: {
          fontSize: 19,
          fontWeight: '700',
          color: colors.text,
        },
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerShadowVisible: true,
        // headerShadowVisible 이 true 이면 iOS 에서 borderBottom 이 자동으로 그려짐.
        // Android 용 elevation 도 함께 적용하기 위해 headerStyle 안에 elevation 을 넣지 않고
        // headerShadowVisible 로만 처리 (RN 표준).
        headerLeft: () => (
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/create')}
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
            <Ionicons name="notifications-outline" size={ICON_SIZE} color={colors.text} />
          </Pressable>
        ),

        // ─── 하단 탭바 ────────────────────────────────────────────
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
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
  )
}
