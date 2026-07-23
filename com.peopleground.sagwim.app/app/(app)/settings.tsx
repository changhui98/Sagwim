import React, { useCallback, useMemo } from 'react'
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { Stack, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../src/context/AuthContext'
import { useTheme } from '../../src/context/ThemeContext'
import { fontSize, spacing } from '../../src/constants/theme'
import type { AppColors } from '../../src/constants/theme'

function SettingsRow({
  label,
  onPress,
  danger,
  colors,
  styles,
}: {
  label: string
  onPress: () => void
  danger?: boolean
  colors: AppColors
  styles: ReturnType<typeof buildStyles>
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={danger ? colors.error : colors.textMuted} />
    </Pressable>
  )
}

function buildStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
    section: {
      marginTop: spacing.sp2,
      borderBottomWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp4,
    },
    rowPressed: { backgroundColor: colors.surface2 },
    rowLabel: { fontSize: fontSize.base, color: colors.text },
    rowLabelDanger: { color: colors.error },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: spacing.sp4,
    },
    darkModeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sp4,
      paddingVertical: spacing.sp3,
    },
    darkModeLabel: { fontSize: fontSize.base, color: colors.text },
  })
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { logout } = useAuth()
  const { colors, theme, toggleTheme } = useTheme()

  const styles = useMemo(() => buildStyles(colors), [colors])

  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/(auth)/landing')
        },
      },
    ])
  }, [logout])

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.headerSide} onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.headerBack}>돌아가기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>설정</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.section}>
          {/* 내 활동 */}
          <SettingsRow
            label="내 활동"
            onPress={() => router.push('/(app)/my-activity')}
            colors={colors}
            styles={styles}
          />
          <View style={styles.divider} />

          {/* 비밀번호 변경 */}
          <SettingsRow
            label="비밀번호 변경"
            onPress={() => router.push('/(app)/settings-change-password')}
            colors={colors}
            styles={styles}
          />
          <View style={styles.divider} />

          {/* 다크 모드 */}
          <View style={styles.darkModeRow}>
            <Text style={styles.darkModeLabel}>다크 모드</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />

          {/* 로그아웃 */}
          <SettingsRow
            label="로그아웃"
            onPress={handleLogout}
            danger
            colors={colors}
            styles={styles}
          />
          <View style={styles.divider} />

          {/* 회원탈퇴 */}
          <SettingsRow
            label="회원탈퇴"
            onPress={() => router.push('/(app)/settings-withdraw')}
            danger
            colors={colors}
            styles={styles}
          />
        </View>
      </View>
    </>
  )
}
