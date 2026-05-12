import { Stack } from 'expo-router'
import { AuthProvider } from '../src/context/AuthContext'
import { useFonts, PlaywriteIE_300Light } from '@expo-google-fonts/playwrite-ie'

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlaywriteIE_300Light,
  })

  // 폰트 로드 실패 시에도 앱이 시스템 폰트 fallback 으로 정상 진입
  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  )
}
