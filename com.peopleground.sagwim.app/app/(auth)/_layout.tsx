import { Stack } from 'expo-router'

/**
 * 인증 그룹 레이아웃
 * - 헤더 완전 숨김 (로그인/회원가입은 자체 헤더 없음)
 * - SafeAreaView는 각 화면에서 직접 처리
 * - gestureEnabled: true — 로그인 ↔ 회원가입 iOS 스와이프 백 허용
 * - fullScreenGestureEnabled: true — 화면 어디서든 스와이프로 뒤로 가기 (react-native-screens native-stack 지원)
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    />
  )
}
