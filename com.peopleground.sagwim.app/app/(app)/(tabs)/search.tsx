import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { fontSize, spacing } from '../../../src/constants/theme'
import { useTheme } from '../../../src/context/ThemeContext'

export default function SearchScreen() {
  const { colors } = useTheme()

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.sp6 },
    title: { fontSize: fontSize.xl2, fontWeight: '700', color: colors.text, marginBottom: spacing.sp2 },
    hint: { fontSize: fontSize.base, color: colors.textMuted },
  }), [colors])

  return (
    <View style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>검색</Text>
        <Text style={styles.hint}>검색 기능은 준비 중이에요.</Text>
      </View>
    </View>
  )
}
