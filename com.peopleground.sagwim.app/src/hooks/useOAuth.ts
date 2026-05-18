/**
 * useOAuth — 카카오 / 구글 소셜 로그인 훅 (stub)
 *
 * [현재 상태]
 * expo-auth-session / expo-crypto 네이티브 모듈 의존성을 제거한 stub 구현입니다.
 * 소셜 로그인 버튼을 누르면 "앱 배포 버전에서 제공됩니다" 알림만 표시합니다.
 *
 * [추후 복원 시]
 * 1. expo-auth-session, expo-web-browser 의존성을 package.json에 추가
 * 2. pod install + Xcode 클린 리빌드 실행
 * 3. 아래 STUB 구현을 이전 전체 구현으로 교체
 *
 * [실제 구현 흐름 — 참고용]
 * 1. expo-auth-session으로 OAuth 제공자 인증 URL 열어 authorization code 수신
 * 2. code + redirectUri → 백엔드 /auth/social/sign-in
 * 3. 백엔드가 JWT 반환 → AuthContext.login()으로 저장
 * 4. 409 충돌(이메일 중복) → Alert로 확인 후 /auth/social/link 호출
 */

import { useCallback, useState } from 'react'
import { Alert } from 'react-native'

interface UseOAuthResult {
  loading: boolean
  handleKakaoLogin: () => Promise<void>
  handleGoogleLogin: () => Promise<void>
}

export function useOAuth(): UseOAuthResult {
  const [loading] = useState(false)

  const showUnavailableAlert = useCallback((provider: '카카오' | '구글') => {
    Alert.alert(
      '소셜 로그인 준비 중',
      `${provider} 로그인은 앱 배포 버전에서 제공됩니다.`,
      [{ text: '확인', style: 'default' }],
    )
  }, [])

  const handleKakaoLogin = useCallback(async () => {
    showUnavailableAlert('카카오')
  }, [showUnavailableAlert])

  const handleGoogleLogin = useCallback(async () => {
    showUnavailableAlert('구글')
  }, [showUnavailableAlert])

  return { loading, handleKakaoLogin, handleGoogleLogin }
}
