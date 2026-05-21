import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSize, radius, shadow, spacing } from '../../../src/constants/theme'

export default function CreateScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>만들기</Text>
      </View>

      <View style={styles.body}>
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push('/(app)/post-create')}
          accessibilityRole="button"
          accessibilityLabel="게시글 작성"
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name="document-text-outline" size={36} color={colors.accent} />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>게시글 작성</Text>
            <Text style={styles.cardSubtitle}>내 이야기를 나눠보세요</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push('/(app)/group-create')}
          accessibilityRole="button"
          accessibilityLabel="모임 만들기"
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name="people-outline" size={36} color={colors.accent} />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>모임 만들기</Text>
            <Text style={styles.cardSubtitle}>새로운 모임을 시작해보세요</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl2,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    flex: 1,
    padding: spacing.sp4,
    gap: spacing.sp4,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sp5,
    gap: spacing.sp4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  cardPressed: {
    backgroundColor: colors.accentMuted,
  },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
    gap: spacing.sp1,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
})
