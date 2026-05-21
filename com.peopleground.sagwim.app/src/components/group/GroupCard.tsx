import React from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { GroupResponse } from '../../types/group'
import { GROUP_CATEGORY_LABELS, GROUP_MEETING_TYPE_LABELS } from '../../types/group'
import { colors, fontSize, radius, spacing } from '../../constants/theme'
import { resolveImageUrl } from '../../lib/resolveImageUrl'

/**
 * 가로 스크롤 섹션에서 한 화면에 3장씩 보이도록 너비를 계산한다.
 * 좌/우 페이지 패딩(sp4) + 카드 사이 간격(sp3 * 2)을 제외한 영역을 3등분.
 */
const SCREEN_W = Dimensions.get('window').width
const PAGE_PADDING = spacing.sp4
const CARD_GAP = spacing.sp3
export const GROUP_CARD_WIDTH = Math.floor(
  (SCREEN_W - PAGE_PADDING * 2 - CARD_GAP * 2) / 3,
)

interface GroupCardProps {
  group: GroupResponse
  onPress: (groupId: number) => void
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  return (
    <Pressable
      onPress={() => onPress(group.id)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.imageWrap}>
        {resolveImageUrl(group.imageUrl) ? (
          <Image
            source={resolveImageUrl(group.imageUrl)!}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🏠</Text>
          </View>
        )}

        {group.status === 'PENDING' && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>승인 대기중</Text>
          </View>
        )}

        <View style={styles.meetingBadge}>
          <Text style={styles.meetingBadgeText} numberOfLines={1}>
            {group.meetingType === 'OFFLINE' && group.region
              ? `${GROUP_MEETING_TYPE_LABELS[group.meetingType]} · ${group.region}`
              : GROUP_MEETING_TYPE_LABELS[group.meetingType]}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.category} numberOfLines={1}>
          {GROUP_CATEGORY_LABELS[group.category]}
        </Text>
        <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
        <Text style={styles.member}>
          {group.currentMemberCount}/{group.maxMemberCount}명
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: GROUP_CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.7,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surface3,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 36,
  },
  pendingBadge: {
    position: 'absolute',
    top: spacing.sp2,
    left: spacing.sp2,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sp2,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  meetingBadge: {
    position: 'absolute',
    bottom: spacing.sp2,
    left: spacing.sp2,
    right: spacing.sp2,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: spacing.sp2,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  meetingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: spacing.sp3,
    paddingVertical: spacing.sp2,
    gap: 2,
  },
  category: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  member: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
})
