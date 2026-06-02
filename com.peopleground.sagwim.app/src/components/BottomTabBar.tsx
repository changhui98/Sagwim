import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../context/ThemeContext'

const ICON_SIZE = 24
const TAB_CONTENT_HEIGHT = 44

type TabItem = {
  key: string
  icon: keyof typeof Ionicons.glyphMap
  path: string
}

const TABS: TabItem[] = [
  { key: 'home', icon: 'home-outline', path: '/(app)/(tabs)' },
  { key: 'search', icon: 'search-outline', path: '/(app)/(tabs)/search' },
  { key: 'posts', icon: 'reader-outline', path: '/(app)/(tabs)/posts' },
  { key: 'messages', icon: 'chatbubble-outline', path: '/(app)/(tabs)/messages' },
  { key: 'profile', icon: 'person-circle-outline', path: '/(app)/(tabs)/profile' },
]

/**
 * (tabs) 그룹 밖의 화면(예: user-profile)에서도 하단 탭바를 노출하기 위한 공용 탭바.
 * 디자인은 (tabs)/_layout.tsx 의 expo-router Tabs 탭바와 동일하게 맞춘다.
 * 항목 탭 시 해당 탭으로 이동한다.
 */
export function BottomTabBar() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()

  const styles = useMemo(() => StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      height: TAB_CONTENT_HEIGHT + insets.bottom,
      paddingBottom: insets.bottom,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [colors, insets.bottom])

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => (
        <Pressable
          key={tab.key}
          style={styles.item}
          onPress={() => router.navigate(tab.path as never)}
          accessibilityRole="button"
        >
          <Ionicons name={tab.icon} size={ICON_SIZE} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  )
}
