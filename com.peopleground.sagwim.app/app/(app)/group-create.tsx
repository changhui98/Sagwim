import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { createGroup } from '../../src/api/groupApi'
import {
  GROUP_CATEGORY_LABELS,
  GROUP_MEETING_TYPE_LABELS,
  type GroupCategory,
  type GroupMeetingType,
} from '../../src/types/group'
import { colors, fontSize, radius, spacing } from '../../src/constants/theme'

const CATEGORIES = Object.keys(GROUP_CATEGORY_LABELS) as GroupCategory[]

export default function GroupCreateScreen() {
  const insets = useSafeAreaInsets()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GroupCategory | null>(null)
  const [meetingType, setMeetingType] = useState<GroupMeetingType>('OFFLINE')
  const [maxMemberCount, setMaxMemberCount] = useState('10')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (name.trim().length === 0) {
      Alert.alert('입력 오류', '모임 이름을 입력해주세요.')
      return
    }
    if (!category) {
      Alert.alert('입력 오류', '카테고리를 선택해주세요.')
      return
    }
    const maxCount = parseInt(maxMemberCount, 10)
    if (Number.isNaN(maxCount) || maxCount < 2) {
      Alert.alert('입력 오류', '최대 인원은 2명 이상이어야 합니다.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        meetingType,
        maxMemberCount: maxCount,
      })
      router.replace({
        pathname: '/(app)/group-detail',
        params: { id: String(created.id) },
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : '모임 생성에 실패했습니다.'
      Alert.alert('생성 실패', msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
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
          <Text style={styles.headerTitle}>모임 만들기</Text>
          <View style={styles.headerBack} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 모임 이름 */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                모임 이름 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="모임 이름을 입력해주세요"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                maxLength={50}
              />
              <Text style={styles.charCount}>{name.length}/50</Text>
            </View>

            {/* 설명 */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>설명</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder="모임을 소개해주세요 (선택)"
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                maxLength={1000}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length}/1000</Text>
            </View>

            {/* 카테고리 */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                카테고리 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const selected = category === cat
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.categoryBtn, selected && styles.categoryBtnSelected]}
                      onPress={() => setCategory(cat)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[styles.categoryBtnText, selected && styles.categoryBtnTextSelected]}
                        numberOfLines={1}
                      >
                        {GROUP_CATEGORY_LABELS[cat]}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* 모임 방식 */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                모임 방식 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.toggleRow}>
                {(['OFFLINE', 'ONLINE'] as GroupMeetingType[]).map((mt) => {
                  const selected = meetingType === mt
                  return (
                    <Pressable
                      key={mt}
                      style={[styles.toggleBtn, selected && styles.toggleBtnSelected]}
                      onPress={() => setMeetingType(mt)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[styles.toggleBtnText, selected && styles.toggleBtnTextSelected]}
                      >
                        {GROUP_MEETING_TYPE_LABELS[mt]}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* 최대 인원 */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                최대 인원 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.textInputShort]}
                placeholder="10"
                placeholderTextColor={colors.textMuted}
                value={maxMemberCount}
                onChangeText={(v) => setMaxMemberCount(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={styles.fieldHint}>최소 2명 이상</Text>
            </View>
          </ScrollView>

          {/* 하단 고정 버튼 */}
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, spacing.sp4) },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                submitting && styles.submitBtnDisabled,
              ]}
              onPress={() => void handleSubmit()}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="모임 만들기"
            >
              <Text style={styles.submitBtnText}>
                {submitting ? '생성 중...' : '모임 만들기'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.sp4,
    gap: spacing.sp2,
  },
  fieldBlock: {
    marginBottom: spacing.sp5,
    gap: spacing.sp2,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  required: {
    color: colors.accent,
  },
  fieldHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sp3,
    paddingVertical: spacing.sp3,
    fontSize: fontSize.base,
    color: colors.text,
    backgroundColor: colors.surface2,
  },
  textInputMultiline: {
    minHeight: 100,
    paddingTop: spacing.sp3,
  },
  textInputShort: {
    width: 100,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sp2,
  },
  categoryBtn: {
    width: '47%',
    paddingVertical: spacing.sp3,
    paddingHorizontal: spacing.sp2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: 'center',
  },
  categoryBtnSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  categoryBtnText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryBtnTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sp3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sp3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: 'center',
  },
  toggleBtnSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  toggleBtnText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  toggleBtnTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  bottomBar: {
    paddingHorizontal: spacing.sp4,
    paddingTop: spacing.sp3,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.sp4,
    alignItems: 'center',
  },
  submitBtnPressed: {
    backgroundColor: colors.accentHover,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: '#fff',
  },
})
