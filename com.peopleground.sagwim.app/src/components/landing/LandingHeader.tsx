/**
 * LandingHeader — FE MobileHeader의 비로그인 상태 축약 이식.
 * 중앙 "Sagwim" 브랜드, 우측 테마 토글 + "로그인" pill.
 * (웹의 좌측 검색은 보호 라우트 대상 + 앱에 AuthGate 부재로 미이식)
 */

import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { fontSize, radius, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

interface LandingHeaderProps {
  onPressLogin: () => void
}

export function LandingHeader({ onPressLogin }: LandingHeaderProps) {
  const { colors, theme, toggleTheme } = useTheme()

  const styles = React.useMemo(() => StyleSheet.create({
    header: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sp4,
      backgroundColor: colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    side: { width: 96, flexDirection: 'row', alignItems: 'center' },
    sideRight: { justifyContent: 'flex-end', gap: spacing.sp2 },
    brand: {
      flex: 1,
      textAlign: 'center',
      fontSize: fontSize.xl2,
      fontWeight: '300',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loginBtn: {
      paddingVertical: spacing.sp1 + 2,
      paddingHorizontal: spacing.sp3,
      borderRadius: radius.full,
      backgroundColor: colors.accent,
    },
    loginBtnText: { color: colors.onAccent, fontSize: fontSize.sm, fontWeight: '700' },
    pressed: { opacity: 0.7 },
  }), [colors])

  return (
    <View style={styles.header}>
      <View style={styles.side} />
      <Text style={styles.brand}>Sagwim</Text>
      <View style={[styles.side, styles.sideRight]}>
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={onPressLogin}
          style={({ pressed }) => [styles.loginBtn, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.loginBtnText}>로그인</Text>
        </Pressable>
      </View>
    </View>
  )
}
