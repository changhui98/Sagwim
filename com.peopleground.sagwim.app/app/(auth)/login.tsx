/**
 * 로그인 화면 — FE LoginPage 디자인 이식
 *
 * 모바일 표준 인터랙션:
 * - SafeAreaView: 노치/홈 인디케이터 고려
 * - KeyboardAvoidingView: 키보드 가림 방지
 * - TextInput: autoCapitalize, keyboardType, textContentType, autoComplete 설정
 *
 * OAuth(Kakao/Google): UI 자리만 잡고 비활성 처리 (이번 범위 아님)
 */

import React, { useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { signIn } from '../../src/api/authApi'
import { TextField } from '../../src/components/TextField'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { colors, spacing, radius, fontSize } from '../../src/constants/theme'

export default function LoginScreen() {
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }
    try {
      setLoading(true)
      setError('')
      const token = await signIn({ username: username.trim(), password })
      await login(token)
      router.replace('/(app)')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 카드 */}
          <View style={styles.card}>
            {/* 헤딩 */}
            <Text style={styles.heading}>다시 오셨군요</Text>
            <Text style={styles.subheading}>계정에 로그인하세요</Text>

            {/* 아이디 */}
            <TextField
              label="아이디"
              placeholder="username"
              value={username}
              onChangeText={(v) => {
                setUsername(v)
                setError('')
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              keyboardType="default"
              returnKeyType="next"
            />

            {/* 비밀번호 */}
            <TextField
              label="비밀번호"
              placeholder="••••••••"
              value={password}
              onChangeText={(v) => {
                setPassword(v)
                setError('')
              }}
              isPassword
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {/* 에러 메시지 */}
            {error ? (
              <View style={styles.alertError}>
                <Text style={styles.alertErrorText}>{error}</Text>
              </View>
            ) : null}

            {/* 로그인 버튼 */}
            <PrimaryButton
              label={loading ? '로그인 중…' : '로그인'}
              loading={loading}
              onPress={handleSubmit}
              style={styles.submitBtn}
            />

            {/* 구분선 */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OAuth 버튼 — UI 자리만 (비활성) */}
            <View style={styles.oauthSection}>
              <TouchableOpacity style={[styles.oauthBtn, styles.kakaoBtn]} disabled>
                <Text style={styles.oauthBtnText}>카카오로 계속하기</Text>
                <Text style={styles.comingSoon}>준비 중</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.oauthBtn, styles.googleBtn]} disabled>
                <Text style={styles.oauthBtnText}>구글로 계속하기</Text>
                <Text style={styles.comingSoon}>준비 중</Text>
              </TouchableOpacity>
            </View>

            {/* 회원가입 링크 */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>아직 계정이 없으신가요? </Text>
              <Pressable onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.footerLink}>회원가입</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp8,
    paddingVertical: spacing.sp8,
  },
  card: {
    width: '100%',
    maxWidth: 420,
  },
  heading: {
    fontSize: fontSize.xl4,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sp1,
  },
  subheading: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginBottom: spacing.sp8,
  },
  submitBtn: {
    marginTop: spacing.sp2,
  },
  alertError: {
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    padding: spacing.sp3,
    marginBottom: spacing.sp4,
  },
  alertErrorText: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sp5,
    gap: spacing.sp3,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  oauthSection: {
    gap: spacing.sp3,
  },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.5,
    gap: spacing.sp3,
  },
  kakaoBtn: {
    backgroundColor: '#FEE500',
    borderColor: '#FEE500',
  },
  googleBtn: {
    backgroundColor: colors.surface,
  },
  oauthBtnText: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
  },
  comingSoon: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    backgroundColor: colors.surface3,
    paddingHorizontal: spacing.sp2,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sp5,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
  },
})
