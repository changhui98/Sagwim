import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, fontSize, spacing } from '../../../src/constants/theme'

export default function PostsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <Text style={styles.title}>게시글</Text>
        <Text style={styles.hint}>게시글 목록은 준비 중이에요.</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.sp6 },
  title: { fontSize: fontSize.xl2, fontWeight: '700', color: colors.text, marginBottom: spacing.sp2 },
  hint: { fontSize: fontSize.base, color: colors.textMuted },
})
