import React from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { GroupResponse } from '../../types/group'
import { GroupCard } from './GroupCard'
import { colors, fontSize, spacing } from '../../constants/theme'

interface GroupSectionProps {
  title: string
  groups: GroupResponse[]
  loading?: boolean
  emptyMessage?: string
  onPressGroup: (groupId: number) => void
  onPressMore?: () => void
}

export function GroupSection({
  title,
  groups,
  loading = false,
  emptyMessage = '아직 표시할 모임이 없어요.',
  onPressGroup,
  onPressMore,
}: GroupSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onPressMore && (
          <Pressable
            onPress={onPressMore}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <Text style={styles.more}>전체 보기 ›</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>불러오는 중...</Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => String(g.id)}
          renderItem={({ item }) => (
            <GroupCard group={item} onPress={onPressGroup} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.sp8,
  },
  header: {
    paddingHorizontal: spacing.sp4,
    marginBottom: spacing.sp3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  more: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.sp4,
  },
  separator: {
    width: spacing.sp3,
  },
  empty: {
    marginHorizontal: spacing.sp4,
    paddingVertical: spacing.sp8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
})
