import React, { useRef, useState } from 'react'
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
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { updatePost } from '../../src/api/postApi'
import { colors, fontSize, radius, spacing } from '../../src/constants/theme'

const MAX_TAG_LENGTH = 20
const MAX_TAGS = 10

export default function PostEditScreen() {
  const insets = useSafeAreaInsets()
  const { contentId, initialBody, initialTags } = useLocalSearchParams<{
    contentId: string
    initialBody: string
    initialTags: string
  }>()

  const tagInputRef = useRef<TextInput>(null)
  const [body, setBody] = useState(initialBody ?? '')
  const [tags, setTags] = useState<string[]>(initialTags ? JSON.parse(initialTags) : [])
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = body.trim().length > 0 && !submitting

  const handleTagSubmit = () => {
    const trimmed = tagInput.trim().replace(/^#/, '')
    if (!trimmed || tags.includes(trimmed) || tags.length >= MAX_TAGS) return
    if (trimmed.length > MAX_TAG_LENGTH) {
      Alert.alert('태그 오류', `태그는 ${MAX_TAG_LENGTH}자 이하로 입력하세요.`)
      return
    }
    setTags((prev) => [...prev, trimmed])
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSubmit = async () => {
    if (!canSubmit || !contentId) return
    setSubmitting(true)
    try {
      await updatePost(Number(contentId), body.trim(), tags.length > 0 ? tags : [])
      router.back()
    } catch {
      Alert.alert('수정 실패', '게시글 수정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Pressable
              style={styles.headerSide}
              onPress={() => router.back()}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>게시글 수정</Text>
            <Pressable
              style={styles.headerSide}
              onPress={() => void handleSubmit()}
              disabled={!canSubmit}
              hitSlop={8}
            >
              <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                {submitting ? '저장 중...' : '저장'}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.sp8 }]}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.bodyInput}
              multiline
              placeholder="내용을 입력하세요..."
              placeholderTextColor={colors.textMuted}
              value={body}
              onChangeText={setBody}
              autoFocus
              textAlignVertical="top"
            />

            <View style={styles.sectionDivider} />

            {/* 태그 */}
            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>태그</Text>
              {tags.length > 0 && (
                <View style={styles.tagList}>
                  {tags.map((tag) => (
                    <Pressable
                      key={tag}
                      style={styles.tagChip}
                      onPress={() => handleRemoveTag(tag)}
                    >
                      <Text style={styles.tagChipText}>#{tag}</Text>
                      <Ionicons name="close" size={12} color={colors.accent} />
                    </Pressable>
                  ))}
                </View>
              )}
              <TextInput
                ref={tagInputRef}
                style={styles.tagInput}
                placeholder="태그 입력 후 Enter"
                placeholderTextColor={colors.textMuted}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleTagSubmit}
                returnKeyType="done"
                blurOnSubmit={false}
                maxLength={MAX_TAG_LENGTH + 1}
                editable={tags.length < MAX_TAGS}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp2,
    paddingVertical: spacing.sp3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSide: {
    width: 56,
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
  submitText: { fontSize: fontSize.base, fontWeight: '700', color: colors.accent },
  submitTextDisabled: { color: colors.textMuted },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  bodyInput: {
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: fontSize.base * 1.7,
    minHeight: 160,
    padding: spacing.sp4,
    textAlignVertical: 'top',
  },
  sectionDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.sp4 },
  tagSection: { padding: spacing.sp4, gap: spacing.sp3 },
  tagLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sp2 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sp2,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  tagChipText: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '500' },
  tagInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sp3,
    paddingVertical: spacing.sp3,
    fontSize: fontSize.base,
    color: colors.text,
    backgroundColor: colors.surface,
  },
})
