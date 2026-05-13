/**
 * 프로필 탭 — Step 1 단순 버전.
 * 임시: 사용자 정보 표시 + 로그아웃 (기존 placeholder 홈에 있던 로그아웃 기능 이관).
 * 실제 프로필 화면(편집/설정/회원 탈퇴 등)은 추후 단계에서 구현.
 */

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../../src/context/AuthContext'
import { PrimaryButton } from '../../../src/components/PrimaryButton'
import { colors, fontSize, radius, spacing } from '../../../src/constants/theme'

export default function ProfileScreen() {
  const { meUsername, meNickname, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.replace('/(auth)/login')
  }

  return (
    <View style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.greeting}>안녕하세요!</Text>
          <Text style={styles.nickname}>{meNickname ?? meUsername ?? '사용자'}</Text>
          <Text style={styles.hint}>프로필 화면은 준비 중이에요.</Text>
        </View>

        <PrimaryButton
          label="로그아웃"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: {
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  greeting: {
    fontSize: fontSize.xl2,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sp2,
  },
  nickname: {
    fontSize: fontSize.xl3,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: spacing.sp4,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: colors.error,
  },
})
