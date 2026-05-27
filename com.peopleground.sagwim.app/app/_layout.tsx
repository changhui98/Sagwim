import { Stack } from 'expo-router'
import { AuthProvider } from '../src/context/AuthContext'
import { ThemeProvider } from '../src/context/ThemeContext'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ThemeProvider>
  )
}
