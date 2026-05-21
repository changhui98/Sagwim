import React, { useState } from 'react'
import {
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker'
import { createGroup, uploadGroupImage } from '../../src/api/groupApi'
import {
  GROUP_CATEGORY_LABELS,
  GROUP_MEETING_TYPE_LABELS,
  type GroupCategory,
  type GroupJoinType,
  type GroupMeetingType,
} from '../../src/types/group'
import { colors, fontSize, radius, spacing } from '../../src/constants/theme'

const CATEGORIES = Object.keys(GROUP_CATEGORY_LABELS) as GroupCategory[]

const SUBCATEGORIES: Record<GroupCategory, string[]> = {
  SPORTS:    ['축구', '농구', '야구', '배드민턴', '테니스', '수영', '헬스', '등산', '러닝', '자전거', '클라이밍', '요가·필라테스'],
  CULTURE:   ['영화', '공연·뮤지컬', '전시·미술관', '독서', '연극', '음악회'],
  FOOD:      ['맛집탐방', '술·와인', '카페', '베이킹·요리', '다이어트식단'],
  GAME:      ['보드게임', '모바일게임', 'PC게임', '콘솔게임', 'VR게임'],
  STUDY:     ['어학·외국어', '자격증', '직무역량', '독서', '코딩·IT', '재테크·투자'],
  HOBBY:     ['그림·드로잉', 'DIY·공예', '사진', '꽃꽂이', '도예', '뜨개질'],
  MUSIC:     ['밴드·합주', '악기배우기', '노래·보컬', '작사·작곡'],
  TRAVEL:    ['국내여행', '해외여행', '캠핑', '드라이브', '당일치기'],
  PET:       ['강아지', '고양이', '특수동물', '유기동물봉사'],
  VOLUNTEER: ['환경보호', '복지시설', '아동·청소년', '노인복지', '해외봉사'],
  BUSINESS:  ['창업·스타트업', '마케팅', 'IT·개발', '디자인', '투자·재테크'],
  LIFESTYLE: ['패션·뷰티', '인테리어', '미니멀라이프', '웰빙·건강'],
  SOCIAL:    ['동네모임', '나이대별', '동호회', '번개모임'],
}

export default function GroupCreateScreen() {
  const insets = useSafeAreaInsets()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [category, setCategory] = useState<GroupCategory | null>(null)
  const [subCategories, setSubCategories] = useState<string[]>([])
  const [meetingType, setMeetingType] = useState<GroupMeetingType>('OFFLINE')
  const [joinType, setJoinType] = useState<GroupJoinType>('OPEN')
  const [joinQuestions, setJoinQuestions] = useState<string[]>([''])
  const [maxMemberCount, setMaxMemberCount] = useState('10')
  const [submitting, setSubmitting] = useState(false)

  const toggleSubCategory = (sub: string) => {
    setSubCategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    )
  }

  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })
    if (!result.canceled) {
      setCoverImage(result.assets[0].uri)
    }
  }

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
        joinType,
        maxMemberCount: maxCount,
        joinQuestions: joinType === 'APPROVAL_REQUIRED'
          ? joinQuestions.filter(q => q.trim().length > 0)
          : undefined,
      })
      if (coverImage) {
        try {
          await uploadGroupImage(created.id, coverImage)
        } catch {
          // 이미지 업로드 실패 시 모임은 생성된 상태이므로 silent하게 진행
        }
      }
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
      <Stack.Screen options={{ headerShown: false, gestureEnabled: step === 1 }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 커스텀 헤더 */}
        <View style={styles.header}>
          <Pressable
            style={styles.headerBack}
            onPress={() => {
              if (step === 3) setStep(2)
              else if (step === 2) setStep(1)
              else router.back()
            }}
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
            {step === 1 && (
              <>
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
                  <Text style={styles.fieldHint}>
                    욕설·혐오·차별·성적 표현이 포함된 이름은 등록이 제한됩니다.
                  </Text>
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
                  <Text style={styles.fieldHint}>
                    불건전하거나 타인을 비방하는 내용이 포함된 경우, 운영 정책에 따라 모임이 삭제될 수 있습니다.
                  </Text>
                </View>

                {/* 대표 사진 */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>대표 사진</Text>
                  <Pressable
                    style={styles.imagePicker}
                    onPress={() => void pickCoverImage()}
                    accessibilityRole="button"
                    accessibilityLabel="대표 사진 선택"
                  >
                    {coverImage ? (
                      <>
                        <Image
                          source={{ uri: coverImage }}
                          style={styles.imagePreview}
                          resizeMode="cover"
                        />
                        <Pressable
                          style={styles.imageRemove}
                          onPress={() => setCoverImage(null)}
                          hitSlop={8}
                          accessibilityLabel="사진 삭제"
                          accessibilityRole="button"
                        >
                          <Ionicons name="close-circle" size={24} color="#fff" />
                        </Pressable>
                      </>
                    ) : (
                      <View style={styles.imagePickerPlaceholder}>
                        <Ionicons name="camera-outline" size={30} color={colors.textMuted} />
                        <Text style={styles.imagePickerText}>사진 추가 (선택)</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </>
            )}

            {step === 2 && (
              <>
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
                          onPress={() => {
                            setCategory(cat)
                            setSubCategories([])
                          }}
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

                {/* 세부 분류 */}
                {category !== null && (
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>세부 분류</Text>
                    <View style={styles.chipRow}>
                      {SUBCATEGORIES[category].map((sub) => {
                        const selected = subCategories.includes(sub)
                        return (
                          <Pressable
                            key={sub}
                            style={[styles.chip, selected && styles.chipSelected]}
                            onPress={() => toggleSubCategory(sub)}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                          >
                            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                              {sub}
                            </Text>
                          </Pressable>
                        )
                      })}
                    </View>
                  </View>
                )}
              </>
            )}

            {step === 3 && (
              <>
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

                {/* 가입 방법 */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>
                    가입 방법 <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.toggleRow}>
                    {([
                      { value: 'OPEN', label: '자유 가입' },
                      { value: 'APPROVAL_REQUIRED', label: '승인 가입' },
                    ] as { value: GroupJoinType; label: string }[]).map(({ value, label }) => {
                      const selected = joinType === value
                      return (
                        <Pressable
                          key={value}
                          style={[styles.toggleBtn, selected && styles.toggleBtnSelected]}
                          onPress={() => {
                            setJoinType(value)
                            if (value === 'OPEN') setJoinQuestions([''])
                          }}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <Text
                            style={[styles.toggleBtnText, selected && styles.toggleBtnTextSelected]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                  <Text style={styles.fieldHint}>
                    승인 가입은 리더가 가입 신청을 직접 승인합니다.
                  </Text>
                </View>

                {/* 가입 질문 */}
                {joinType === 'APPROVAL_REQUIRED' && (
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>가입 질문</Text>
                    {joinQuestions.map((q, idx) => (
                      <View key={idx} style={styles.joinQuestionRow}>
                        <Text style={styles.joinQuestionNum}>{idx + 1}.</Text>
                        <TextInput
                          style={[styles.textInput, styles.joinQuestionInput]}
                          placeholder={`질문 ${idx + 1}`}
                          placeholderTextColor={colors.textMuted}
                          value={q}
                          onChangeText={(text) => {
                            setJoinQuestions((prev) => {
                              const next = [...prev]
                              next[idx] = text
                              return next
                            })
                          }}
                          maxLength={100}
                        />
                        {joinQuestions.length > 1 && (
                          <Pressable
                            style={styles.joinQuestionDelete}
                            onPress={() => {
                              setJoinQuestions((prev) => prev.filter((_, i) => i !== idx))
                            }}
                            hitSlop={8}
                            accessibilityLabel={`질문 ${idx + 1} 삭제`}
                            accessibilityRole="button"
                          >
                            <Ionicons name="close" size={18} color={colors.textMuted} />
                          </Pressable>
                        )}
                      </View>
                    ))}
                    {joinQuestions.length < 5 && (
                      <Pressable
                        style={styles.joinQuestionAddBtn}
                        onPress={() => setJoinQuestions((prev) => [...prev, ''])}
                        accessibilityRole="button"
                        accessibilityLabel="질문 추가"
                      >
                        <Ionicons name="add" size={16} color={colors.accent} />
                        <Text style={styles.joinQuestionAddText}>질문 추가</Text>
                      </Pressable>
                    )}
                  </View>
                )}

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
              </>
            )}
          </ScrollView>

          {/* 하단 고정 버튼 */}
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, spacing.sp4) },
            ]}
          >
            {step === 1 && (
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && styles.submitBtnPressed,
                  name.trim().length === 0 && styles.submitBtnDisabled,
                ]}
                onPress={() => setStep(2)}
                disabled={name.trim().length === 0}
                accessibilityRole="button"
                accessibilityLabel="다음"
              >
                <Text style={styles.submitBtnText}>다음</Text>
              </Pressable>
            )}
            {step === 2 && (
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && styles.submitBtnPressed,
                  category === null && styles.submitBtnDisabled,
                ]}
                onPress={() => setStep(3)}
                disabled={category === null}
                accessibilityRole="button"
                accessibilityLabel="다음"
              >
                <Text style={styles.submitBtnText}>다음</Text>
              </Pressable>
            )}
            {step === 3 && (
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
            )}
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
    fontSize: fontSize.lg,
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
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  required: {
    color: colors.accent,
  },
  fieldHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  charCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'right',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sp3,
    paddingVertical: spacing.sp3,
    fontSize: fontSize.md,
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
  imagePicker: {
    aspectRatio: 16 / 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sp2,
  },
  imagePickerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageRemove: {
    position: 'absolute',
    top: spacing.sp2,
    right: spacing.sp2,
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
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryBtnTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sp2,
  },
  chip: {
    paddingVertical: spacing.sp2,
    paddingHorizontal: spacing.sp3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  chipText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
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
    fontSize: fontSize.md,
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
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  joinQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp2,
  },
  joinQuestionNum: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 20,
  },
  joinQuestionInput: {
    flex: 1,
  },
  joinQuestionDelete: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinQuestionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp1,
    paddingVertical: spacing.sp2,
    alignSelf: 'flex-start',
  },
  joinQuestionAddText: {
    fontSize: fontSize.base,
    color: colors.accent,
    fontWeight: '600',
  },
})
