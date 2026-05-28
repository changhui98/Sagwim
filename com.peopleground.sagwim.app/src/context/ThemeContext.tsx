import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { getItemAsync, setItemAsync } from 'expo-secure-store'
import { lightColors, darkColors, type AppColors } from '../constants/theme'

type ThemeMode = 'light' | 'dark'
const THEME_KEY = 'sagwim_theme_mode'

interface ThemeContextValue {
  theme: ThemeMode
  colors: AppColors
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemeMode>('light')

  useEffect(() => {
    getItemAsync(THEME_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light') setThemeState(stored)
    }).catch(() => {})
  }, [])

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode)
    setItemAsync(THEME_KEY, mode).catch(() => {})
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const colors = theme === 'dark' ? darkColors : lightColors

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, colors, toggleTheme, setTheme }),
    [theme, colors, toggleTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
