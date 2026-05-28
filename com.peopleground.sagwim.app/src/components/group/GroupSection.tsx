import React, { useMemo } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { GroupResponse } from '../../types/group'
import { GroupCard } from './GroupCard'
import { fontSize, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

interface GroupSectionProps {
  title: string
  subtitle?: string
  groups: GroupResponse[]
  loading?: boolean
  emptyMessage?: string
  onPressGroup: (groupId: number) => void
  onPressMore?: () => void
}

export function GroupSection({
  title,
  subtitle,
  groups,
  loading = false,
  emptyMessage = '아직 표시할 모임이 없어요.',
  onPressGroup,
  onPressMore,
}: GroupSectionProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => StyleSheet.create({
    section: { marginBottom: spacing.sp8 },
    header: {
      paddingHorizontal: spacing.sp4,
      marginBottom: spacing.sp3,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleBlock: { flex: 1, gap: 2 },
    title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: fontSize.base, color: colors.textMuted },
    more: { fontSize: fontSize.base, color: colors.textSecondary },
    listContent: { paddingHorizontal: spacing.sp4 },
    separator: { width: spacing.sp3 },
    empty: {
      marginHorizontal: spacing.sp4,
      paddingVertical: spacing.sp8,
      backgroundColor: colors.surface,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: { fontSize: fontSize.base, color: colors.textMuted },
  }), [colors])

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle !== undefined && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
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

