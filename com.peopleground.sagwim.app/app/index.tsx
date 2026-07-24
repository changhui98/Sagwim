import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../src/context/AuthContext'
import { useTheme } from '../src/context/ThemeContext'

/**
 * 진입 분기 라우터
 * - isBootstrapping: SecureStore 읽기 중 → 로딩 스피너
 * - isAuthenticated: (app) 홈으로
 * - 비인증: (auth)/landing (공개 랜딩) 으로
 */
export default function Index() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const { colors } = useTheme()

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />
  }

  return <Redirect href="/(auth)/landing" />
}
