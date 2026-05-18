/**
 * useOAuth — 카카오 / 구글 소셜 로그인 훅
 *
 * [흐름]
 * 1. expo-auth-session으로 OAuth 제공자의 인증 URL을 열어 authorization code를 받는다.
 * 2. code와 redirectUri를 백엔드 /auth/social/sign-in으로 전달한다.
 *    (백엔드가 직접 OAuth 토큰 교환을 수행 — 클라이언트는 code만 전달)
 * 3. 백엔드가 JWT를 반환하면 AuthContext.login()으로 저장한다.
 * 4. 409 충돌(이메일 중복)이면 사용자에게 Alert로 물어보고 /auth/social/link를 호출한다.
 *
 * [환경변수]
 * EXPO_PUBLIC_KAKAO_CLIENT_ID  — 카카오 REST API 키
 * EXPO_PUBLIC_GOOGLE_CLIENT_ID — 구글 OAuth 2.0 클라이언트 ID (iOS용)
 *
 * [주의]
 * - expo-auth-session은 Expo managed workflow에서 네이티브 SDK 없이 동작하는 웹 기반 OAuth.
 * - redirectUri는 Expo의 makeRedirectUri()로 자동 생성 — 실기기/시뮬레이터/EAS 환경에 맞게 조정됨.
 * - 카카오는 Kakao Developers 콘솔에서 해당 redirectUri를 허용 목록에 추가해야 한다.
 * - 구글은 Google Cloud Console의 OAuth 2.0 클라이언트 "승인된 리디렉션 URI"에 추가해야 한다.
 */

import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { socialSignIn, linkSocialAccount } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

// expo-auth-session이 웹 브라우저 결과를 처리할 수 있도록 등록 (iOS/Android 모두 필요)
WebBrowser.maybeCompleteAuthSession()

type OAuthProvider = 'KAKAO' | 'GOOGLE'

interface UseOAuthResult {
  loading: boolean
  handleKakaoLogin: () => Promise<void>
  handleGoogleLogin: () => Promise<void>
}

// ── 카카오 OAuth 엔드포인트 ────────────────────────────────────────────────────
const KAKAO_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
  tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
}

// ── 구글 OAuth 엔드포인트 (Google Identity Platform) ──────────────────────────
const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

export function useOAuth(): UseOAuthResult {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  // redirectUri는 Expo 환경에 따라 자동 결정됨:
  // - 시뮬레이터/개발: exp://...
  // - EAS Build / Standalone: sagwim://
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'sagwim',
    path: 'oauth',
  })

  const handleOAuthLogin = useCallback(
    async (provider: OAuthProvider) => {
      const clientId =
        provider === 'KAKAO'
          ? process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID
          : process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID

      if (!clientId) {
        Alert.alert(
          '설정 오류',
          `${provider === 'KAKAO' ? '카카오' : '구글'} 클라이언트 ID가 설정되지 않았습니다.\n.env 파일을 확인해주세요.`,
        )
        return
      }

      const discovery = provider === 'KAKAO' ? KAKAO_DISCOVERY : GOOGLE_DISCOVERY

      const authRequest = new AuthSession.AuthRequest({
        clientId,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        scopes: provider === 'KAKAO' ? ['profile_nickname', 'account_email'] : ['openid', 'email', 'profile'],
        usePKCE: false, // 백엔드가 PKCE 없이 code 교환을 처리함
      })

      try {
        setLoading(true)

        const result = await authRequest.promptAsync(discovery)

        if (result.type !== 'success') {
          // 사용자가 취소하거나 오류 발생 — 조용히 종료
          return
        }

        const code = result.params.code
        if (!code) {
          Alert.alert('오류', 'Authorization code를 받지 못했습니다.')
          return
        }

        const outcome = await socialSignIn(provider, code, redirectUri)

        if (outcome.type === 'success') {
          await login(outcome.jwtToken)
        } else if (outcome.type === 'email_conflict') {
          // 이메일 충돌 — 사용자에게 기존 계정 연동 여부 확인
          const providerLabel = outcome.provider === 'KAKAO' ? '카카오' : '구글'
          Alert.alert(
            '이미 가입된 이메일',
            `동일한 이메일로 이미 가입된 계정이 있습니다.\n${providerLabel} 계정을 기존 계정에 연동하시겠습니까?`,
            [
              { text: '취소', style: 'cancel' },
              {
                text: '연동하기',
                onPress: async () => {
                  try {
                    setLoading(true)
                    const linked = await linkSocialAccount(outcome.provider, outcome.accessToken)
                    await login(linked.jwtToken)
                  } catch (err) {
                    Alert.alert('연동 실패', err instanceof Error ? err.message : '계정 연동에 실패했습니다.')
                  } finally {
                    setLoading(false)
                  }
                },
              },
            ],
          )
        }
      } catch (err) {
        Alert.alert(
          '로그인 실패',
          err instanceof Error ? err.message : '소셜 로그인 중 오류가 발생했습니다.',
        )
      } finally {
        setLoading(false)
      }
    },
    [login, redirectUri],
  )

  const handleKakaoLogin = useCallback(() => handleOAuthLogin('KAKAO'), [handleOAuthLogin])
  const handleGoogleLogin = useCallback(() => handleOAuthLogin('GOOGLE'), [handleOAuthLogin])

  return { loading, handleKakaoLogin, handleGoogleLogin }
}
