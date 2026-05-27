import { Stack } from 'expo-router'
import { AuthProvider } from '../src/context/AuthContext'
import { ThemeProvider } from '../src/context/ThemeContext'
import { NotificationCountProvider } from '../src/context/NotificationCountContext'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationCountProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationCountProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
