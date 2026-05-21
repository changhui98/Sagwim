import React, { useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { deleteGroup } from '../../src/api/groupApi'
import { colors, fontSize, radius, spacing } from '../../src/constants/theme'

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [deleting, setDeleting] = useState(false)

  const groupId = Number(id)

  const handleDeleteGroup = () => {
    Alert.alert(
      '모임 삭제',
      '정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              await deleteGroup(groupId)
              router.replace('/(app)/(tabs)')
            } catch (e) {
              const msg = e instanceof Error ? e.message : '모임 삭제에 실패했습니다.'
              Alert.alert('삭제 실패', msg)
            } finally {
              setDeleting(false)
            }
          },
        },
      ],
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 커스텀 헤더 */}
        <View style={styles.header}>
          <Pressable
            style={styles.headerBack}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="뒤로가기"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>모임 설정</Text>
          <View style={styles.headerBack} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.sp8 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 일반 설정 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>모임 관리</Text>
            <View style={styles.menuList}>
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => Alert.alert('준비 중', '모임 정보 수정 기능을 준비 중입니다.')}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.menuItemText}>모임 정보 수정</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              <View style={styles.menuDivider} />

              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => Alert.alert('준비 중', '멤버 관리 기능을 준비 중입니다.')}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.menuItemText}>멤버 관리</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* 위험 구역 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>위험 구역</Text>
            <View style={styles.menuList}>
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={handleDeleteGroup}
                disabled={deleting}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.menuItemText, styles.menuItemDanger]}>
                    {deleting ? '삭제 중...' : '모임 삭제'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.error} />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp2,
    paddingVertical: spacing.sp3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginTop: spacing.sp5,
    paddingHorizontal: spacing.sp4,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sp2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuList: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp4,
  },
  menuItemPressed: {
    backgroundColor: colors.surface3,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp3,
  },
  menuItemText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  menuItemDanger: {
    color: colors.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sp4,
  },
})
