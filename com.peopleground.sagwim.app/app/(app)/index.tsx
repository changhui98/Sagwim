/**
 * 임시 보호 홈 화면
 * - 로그인 후 진입 확인용 (실제 홈은 별도 단계에서 구현)
 * - 현재 사용자 정보 표시 + 로그아웃 버튼
 */

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { colors, spacing, radius, fontSize } from '../../src/constants/theme'

export default function AppHomeScreen() {
  const { meUsername, meNickname, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.greeting}>안녕하세요!</Text>
          <Text style={styles.username}>
            {meNickname ?? meUsername ?? '사용자'}
          </Text>
          <Text style={styles.hint}>로그인 상태입니다.</Text>
          <Text style={styles.hint2}>홈 화면은 별도 단계에서 구현됩니다.</Text>
        </View>

        <PrimaryButton
          label="로그아웃"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp6,
    gap: spacing.sp6,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.sp8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 4,
  },
  greeting: {
    fontSize: fontSize.xl2,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sp2,
  },
  username: {
    fontSize: fontSize.xl3,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: spacing.sp4,
  },
  hint: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginBottom: spacing.sp1,
  },
  hint2: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  logoutBtn: {
    backgroundColor: colors.error,
  },
})
