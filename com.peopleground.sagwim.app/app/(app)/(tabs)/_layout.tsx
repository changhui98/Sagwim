/**
 * 하단 탭 네비게이션 (홈 / 검색 / 게시글 / 만들기 / 프로필).
 *
 * - 웹의 사이드바 네비게이션을 모바일 하단 탭으로 이식.
 * - 상단 헤더는 비워 둠 (headerShown: false). 화면별 헤더는 각 화면에서 직접 구성.
 * - 알림 / 관리자 메뉴는 추후 단계에서 추가 예정.
 */

import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../../src/constants/theme'

const ICON_SIZE = 24

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
        name="create"
        options={{
          title: '만들기',
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle-outline" size={ICON_SIZE + 4} color={color} />
          ),
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
