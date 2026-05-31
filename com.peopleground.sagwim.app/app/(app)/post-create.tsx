import React, { useMemo, useRef, useState } from 'react'
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
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import { createPost, uploadContentImage } from '../../src/api/postApi'
import { markPostsDirty } from '../../src/lib/listRefresh'
import { fontSize, radius, spacing } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'

const MAX_IMAGES = 5
const MAX_TAG_LENGTH = 20
const MAX_TAGS = 10

export default function PostCreateScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const tagInputRef = useRef<TextInput>(null)

  const [body, setBody] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = body.trim().length > 0 && !submitting

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 첨부를 위해 사진 라이브러리 접근 권한이 필요합니다.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, MAX_IMAGES))
    }
  }

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

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
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const created = await createPost({
        body: body.trim(),
        tags: tags.length > 0 ? tags : undefined,
      })
      if (images.length > 0) {
        await Promise.all(images.map((uri) => uploadContentImage(created.id, uri)))
      }
      markPostsDirty()
      router.back()
    } catch (e) {
      const msg = axios.isAxiosError(e)
        ? (e.response?.data?.message ?? e.message)
        : e instanceof Error
          ? e.message
          : '게시글 등록에 실패했습니다.'
      Alert.alert('등록 실패', msg)
    } finally {
      setSubmitting(false)
    }
  }

  const styles = useMemo(() => StyleSheet.create({
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
    submitText: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: colors.accent,
    },
    submitTextDisabled: {
      color: colors.textMuted,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    bodyInput: {
      fontSize: fontSize.base,
      color: colors.text,
      lineHeight: fontSize.base * 1.7,
      minHeight: 160,
      padding: spacing.sp4,
      paddingTop: spacing.sp4,
      textAlignVertical: 'top',
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.sp4,
    },
    // 사진 섹션
    imageSection: {
      paddingVertical: spacing.sp4,
    },
    imageRow: {
      paddingHorizontal: spacing.sp4,
      gap: spacing.sp3,
      flexDirection: 'row',
      alignItems: 'center',
    },
    imageThumbWrap: {
      width: 80,
      height: 80,
    },
    imageThumb: {
      width: 80,
      height: 80,
      borderRadius: radius.md,
      backgroundColor: colors.surface3,
    },
    imageRemoveBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: colors.bg,
      borderRadius: radius.full,
    },
    imageAddBtn: {
      width: 80,
      height: 80,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    imageAddBtnPressed: {
      backgroundColor: colors.surface3,
    },
    imageCount: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },
    // 태그 섹션
    tagSection: {
      padding: spacing.sp4,
      gap: spacing.sp3,
    },
    tagLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tagList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sp2,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accentMuted,
      paddingHorizontal: spacing.sp2,
      paddingVertical: 5,
      borderRadius: radius.full,
    },
    tagChipText: {
      fontSize: fontSize.sm,
      color: colors.accent,
      fontWeight: '500',
    },
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
  }), [colors])

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
              accessibilityLabel="뒤로가기"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>게시글 작성</Text>
            <Pressable
              style={styles.headerSide}
              onPress={() => void handleSubmit()}
              disabled={!canSubmit}
              hitSlop={8}
              accessibilityLabel="등록"
              accessibilityRole="button"
            >
              <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                {submitting ? '등록 중...' : '등록'}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.sp8 }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* 섹션 1: 내용 */}
            <TextInput
              style={styles.bodyInput}
              multiline
              placeholder="이웃들에게 이야기를 나눠보세요..."
              placeholderTextColor={colors.textMuted}
              value={body}
              onChangeText={setBody}
              autoFocus
              textAlignVertical="top"
            />

            <View style={styles.sectionDivider} />

            {/* 섹션 2: 사진 */}
            <View style={styles.imageSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                {images.map((uri, idx) => (
                  <View key={uri} style={styles.imageThumbWrap}>
                    <Image source={{ uri }} style={styles.imageThumb} contentFit="cover" />
                    <Pressable
                      style={styles.imageRemoveBtn}
                      onPress={() => handleRemoveImage(idx)}
                      hitSlop={8}
                      accessibilityLabel="사진 삭제"
                      accessibilityRole="button"
                    >
                      <Ionicons name="close-circle" size={22} color={colors.error} />
                    </Pressable>
                  </View>
                ))}
                {images.length < MAX_IMAGES && (
                  <Pressable
                    style={({ pressed }) => [styles.imageAddBtn, pressed && styles.imageAddBtnPressed]}
                    onPress={() => void handlePickImage()}
                    accessibilityLabel="사진 추가"
                    accessibilityRole="button"
                  >
                    <Ionicons name="add" size={28} color={colors.textMuted} />
                    {images.length > 0 && (
                      <Text style={styles.imageCount}>{images.length}/{MAX_IMAGES}</Text>
                    )}
                  </Pressable>
                )}
              </ScrollView>
            </View>

            <View style={styles.sectionDivider} />

            {/* 섹션 3: 태그 */}
            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>태그</Text>

              {tags.length > 0 && (
                <View style={styles.tagList}>
                  {tags.map((tag) => (
                    <Pressable
                      key={tag}
                      style={styles.tagChip}
                      onPress={() => handleRemoveTag(tag)}
                      accessibilityLabel={`태그 ${tag} 삭제`}
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

