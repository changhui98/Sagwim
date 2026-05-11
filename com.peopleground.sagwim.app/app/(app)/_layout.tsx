import { Redirect, Stack } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { ActivityIndicator, View } from 'react-native'
import { colors } from '../../src/constants/theme'

/**
 * 보호된 라우트 그룹 레이아웃
 * - 비인증 상태면 /(auth)/login 으로 리다이렉트
 * - 부트스트래핑 중이면 로딩 화면 표시
 */
export default function AppLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
