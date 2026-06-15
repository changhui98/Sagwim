import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
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
import {
  approveJoinRequest,
  deleteGroup,
  getGroup,
  getGroupJoinQuestions,
  getPendingJoinRequests,
  rejectJoinRequest,
  updateGroup,
  updateGroupJoinQuestions,
} from '../../src/api/groupApi'
import { fontSize, radius, spacing } from '../../src/constants/theme'
import type { AppColors } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'
import { AddressSearchInput } from '../../src/components/common/AddressSearchInput'
import type { GroupDetailResponse, GroupJoinRequestResponse } from '../../src/types/group'

type SubView = 'menu' | 'name' | 'description' | 'address' | 'memberCount' | 'joinRequests' | 'joinType'

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const [deleting, setDeleting] = useState(false)
  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [view, setView] = useState<SubView>('menu')

  const groupId = Number(id)

  useEffect(() => {
    getGroup(groupId)
      .then(setGroup)
      .catch(() => {
        // 로드 실패 시 값 없이 표시 유지
      })
  }, [groupId])

  const joinTypeLabel = group
    ? group.joinType === 'OPEN' ? '자유' : '승인'
    : ''

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

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
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
    scroll: { flex: 1 },
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
    menuItemPressed: { backgroundColor: colors.surface3 },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sp3,
      flex: 1,
    },
    menuItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sp2,
      flexShrink: 0,
    },
    menuItemText: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: '500',
    },
    menuItemValue: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    menuItemDanger: { color: colors.error },
    menuDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.sp4,
    },
  }), [colors])

  // 서브뷰 렌더링
  if (view === 'name' && group) {
    return (
      <NameSubView
        insets={insets}
        group={group}
        groupId={groupId}
        onBack={(updatedName?: string) => {
          if (updatedName !== undefined) {
            setGroup(prev => prev ? { ...prev, name: updatedName } : prev)
          }
          setView('menu')
        }}
      />
    )
  }

  if (view === 'description' && group) {
    return (
      <DescriptionSubView
        insets={insets}
        group={group}
        groupId={groupId}
        onBack={(updatedDescription?: string | null) => {
          if (updatedDescription !== undefined) {
            setGroup(prev => prev ? { ...prev, description: updatedDescription } : prev)
          }
          setView('menu')
        }}
      />
    )
  }

  if (view === 'address' && group) {
    return (
      <AddressSubView
        insets={insets}
        group={group}
        groupId={groupId}
        onBack={(updatedRegion?: string) => {
          if (updatedRegion !== undefined) {
            setGroup(prev => prev ? { ...prev, region: updatedRegion } : prev)
          }
          setView('menu')
        }}
      />
    )
  }

  if (view === 'memberCount' && group) {
    return (
      <MemberCountSubView
        insets={insets}
        group={group}
        groupId={groupId}
        onBack={(updatedCount?: number) => {
          if (updatedCount !== undefined) {
            setGroup(prev => prev ? { ...prev, maxMemberCount: updatedCount } : prev)
          }
          setView('menu')
        }}
      />
    )
  }

  if (view === 'joinRequests') {
    return (
      <JoinRequestsSubView
        insets={insets}
        groupId={groupId}
        onBack={() => setView('menu')}
      />
    )
  }

  if (view === 'joinType' && group) {
    return (
      <JoinTypeSubView
        insets={insets}
        group={group}
        groupId={groupId}
        onBack={(updatedJoinType?: string, updatedQuestions?: string[]) => {
          if (updatedJoinType !== undefined) {
            setGroup(prev =>
              prev
                ? {
                    ...prev,
                    joinType: updatedJoinType as GroupDetailResponse['joinType'],
                    joinQuestions: updatedQuestions ?? prev.joinQuestions,
                  }
                : prev,
            )
          }
          setView('menu')
        }}
      />
    )
  }

  // 메인 메뉴 뷰
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
          {/* 모임 관리 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>모임 관리</Text>
            <View style={styles.menuList}>
              {/* 모임 이름 */}
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => setView('name')}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.menuItemText}>모임 이름</Text>
                </View>
                <View style={styles.menuItemRight}>
                  <Text style={styles.menuItemValue} numberOfLines={1}>
                    {group ? group.name : ''}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </Pressable>

              <View style={styles.menuDivider} />

              {/* 모임 소개 */}
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => setView('description')}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.menuItemText}>모임 소개</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              {/* 모임 위치 (오프라인 모임 전용) */}
              {group?.meetingType === 'OFFLINE' && (
                <>
                  <View style={styles.menuDivider} />
                  <Pressable
                    style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                    onPress={() => setView('address')}
                    accessibilityRole="button"
                  >
                    <View style={styles.menuItemLeft}>
                      <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                      <Text style={styles.menuItemText}>모임 위치</Text>
                    </View>
                    <View style={styles.menuItemRight}>
                      <Text style={styles.menuItemValue} numberOfLines={1}>
                        {group?.region ?? ''}
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </View>
                  </Pressable>
                </>
              )}

              <View style={styles.menuDivider} />

              {/* 모임 인원 변경 */}
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => setView('memberCount')}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.menuItemText}>모임 인원 변경</Text>
                </View>
                <View style={styles.menuItemRight}>
                  <Text style={styles.menuItemValue}>
                    {group ? `${group.maxMemberCount}명` : ''}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </Pressable>

              <View style={styles.menuDivider} />

              {/* 가입 신청 인원 */}
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => setView('joinRequests')}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="person-add-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.menuItemText}>가입 신청 인원</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              <View style={styles.menuDivider} />

              {/* 가입 방식 */}
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => setView('joinType')}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.menuItemText}>가입 방식</Text>
                </View>
                <View style={styles.menuItemRight}>
                  <Text style={styles.menuItemValue}>{joinTypeLabel}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </Pressable>

              <View style={styles.menuDivider} />

              {/* 모임장 변경 */}
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => Alert.alert('준비 중', '모임장 변경 기능을 준비 중입니다.')}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="swap-horizontal-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.menuItemText}>모임장 변경</Text>
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

// ─────────────────────────────────────────────
// SubView: 모임 이름
// ─────────────────────────────────────────────
function NameSubView({
  insets,
  group,
  groupId,
  onBack,
}: {
  insets: { top: number; bottom: number }
  group: GroupDetailResponse
  groupId: number
  onBack: (updatedName?: string) => void
}) {
  const { colors } = useTheme()
  const [name, setName] = useState(group.name)
  const [saving, setSaving] = useState(false)
  const original = useRef(group.name)

  const handleBack = async () => {
    const trimmed = name.trim()
    if (trimmed === original.current || trimmed === '') {
      onBack()
      return
    }
    setSaving(true)
    try {
      await updateGroup(groupId, {
        name: trimmed,
        description: group.description ?? '',
        category: group.category,
        meetingType: group.meetingType,
        region: group.region,
        maxMemberCount: group.maxMemberCount,
        joinType: group.joinType,
      })
      onBack(trimmed)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다.'
      Alert.alert('오류', msg)
    } finally {
      setSaving(false)
    }
  }

  const isDirty = name.trim() !== original.current && name.trim() !== ''

  const subStyles = useMemo(() => buildSubStyles(colors), [colors])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[subStyles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={subStyles.header}>
          <Pressable
            style={subStyles.headerBtn}
            onPress={handleBack}
            disabled={saving}
            hitSlop={8}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : isDirty ? (
              <Text style={subStyles.headerBtnTextAccent}>저장</Text>
            ) : (
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            )}
          </Pressable>
          <Text style={subStyles.headerTitle}>모임 이름</Text>
          <View style={subStyles.headerBtn} />
        </View>

        <View style={subStyles.body}>
          <TextInput
            style={subStyles.input}
            value={name}
            onChangeText={setName}
            maxLength={50}
            editable={!saving}
            placeholder="모임 이름을 입력하세요"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          <Text style={subStyles.charCount}>{name.length} / 50</Text>
        </View>
      </KeyboardAvoidingView>
    </>
  )
}

// ─────────────────────────────────────────────
// SubView: 모임 소개
// ─────────────────────────────────────────────
function DescriptionSubView({
  insets,
  group,
  groupId,
  onBack,
}: {
  insets: { top: number; bottom: number }
  group: GroupDetailResponse
  groupId: number
  onBack: (updatedDescription?: string | null) => void
}) {
  const { colors } = useTheme()
  const [description, setDescription] = useState(group.description ?? '')
  const [saving, setSaving] = useState(false)
  const original = useRef(group.description ?? '')

  const handleBack = async () => {
    const trimmed = description.trim()
    if (trimmed === original.current) {
      onBack()
      return
    }
    setSaving(true)
    try {
      await updateGroup(groupId, {
        name: group.name,
        description: trimmed,
        category: group.category,
        meetingType: group.meetingType,
        region: group.region,
        maxMemberCount: group.maxMemberCount,
        joinType: group.joinType,
      })
      onBack(trimmed || null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다.'
      Alert.alert('오류', msg)
    } finally {
      setSaving(false)
    }
  }

  const isDirty = description.trim() !== original.current

  const subStyles = useMemo(() => buildSubStyles(colors), [colors])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[subStyles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={subStyles.header}>
          <Pressable
            style={subStyles.headerBtn}
            onPress={handleBack}
            disabled={saving}
            hitSlop={8}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : isDirty ? (
              <Text style={subStyles.headerBtnTextAccent}>저장</Text>
            ) : (
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            )}
          </Pressable>
          <Text style={subStyles.headerTitle}>모임 소개</Text>
          <View style={subStyles.headerBtn} />
        </View>

        <View style={subStyles.body}>
          <TextInput
            style={[subStyles.input, subStyles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            maxLength={1000}
            editable={!saving}
            placeholder="모임 소개를 입력하세요"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <Text style={subStyles.charCount}>{description.length} / 1000</Text>
        </View>
      </KeyboardAvoidingView>
    </>
  )
}

// ─────────────────────────────────────────────
// SubView: 모임 위치 (오프라인 주소)
// ─────────────────────────────────────────────
function AddressSubView({
  insets,
  group,
  groupId,
  onBack,
}: {
  insets: { top: number; bottom: number }
  group: GroupDetailResponse
  groupId: number
  onBack: (updatedRegion?: string) => void
}) {
  const { colors } = useTheme()
  const [region, setRegion] = useState(group.region ?? '')
  const [saving, setSaving] = useState(false)
  const original = useRef(group.region ?? '')

  const trimmed = region.trim()
  const isDirty = trimmed !== original.current && trimmed !== ''

  const handleBack = async () => {
    if (!isDirty) {
      onBack()
      return
    }
    setSaving(true)
    try {
      await updateGroup(groupId, {
        name: group.name,
        description: group.description ?? '',
        category: group.category,
        meetingType: group.meetingType,
        region: trimmed,
        maxMemberCount: group.maxMemberCount,
        joinType: group.joinType,
      })
      onBack(trimmed)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다.'
      Alert.alert('오류', msg)
    } finally {
      setSaving(false)
    }
  }

  const subStyles = useMemo(() => buildSubStyles(colors), [colors])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[subStyles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={subStyles.header}>
          <Pressable
            style={subStyles.headerBtn}
            onPress={handleBack}
            disabled={saving}
            hitSlop={8}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : isDirty ? (
              <Text style={subStyles.headerBtnTextAccent}>저장</Text>
            ) : (
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            )}
          </Pressable>
          <Text style={subStyles.headerTitle}>모임 위치</Text>
          <View style={subStyles.headerBtn} />
        </View>

        <ScrollView
          style={subStyles.scroll}
          contentContainerStyle={[subStyles.bodyPadding, { paddingBottom: insets.bottom + spacing.sp8 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AddressSearchInput
            value={region}
            onChange={setRegion}
            disabled={saving}
            autoFocus
            hints={['동·읍·면 단위까지만 입력해 주세요.', '모임 위치는 추천·검색 노출에 활용됩니다.']}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

// ─────────────────────────────────────────────
// SubView: 모임 인원 변경
// ─────────────────────────────────────────────
function MemberCountSubView({
  insets,
  group,
  groupId,
  onBack,
}: {
  insets: { top: number; bottom: number }
  group: GroupDetailResponse
  groupId: number
  onBack: (updatedCount?: number) => void
}) {
  const { colors } = useTheme()
  const [count, setCount] = useState(String(group.maxMemberCount))
  const [saving, setSaving] = useState(false)
  const original = useRef(group.maxMemberCount)

  const parsed = parseInt(count, 10)
  const isValid = !isNaN(parsed) && parsed >= 2 && parsed <= 1000
  const isDirty = isValid && parsed !== original.current

  const handleBack = async () => {
    if (!isDirty) {
      onBack()
      return
    }
    setSaving(true)
    try {
      await updateGroup(groupId, {
        name: group.name,
        description: group.description ?? '',
        category: group.category,
        meetingType: group.meetingType,
        region: group.region,
        maxMemberCount: parsed,
        joinType: group.joinType,
      })
      onBack(parsed)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다.'
      Alert.alert('오류', msg)
    } finally {
      setSaving(false)
    }
  }

  const subStyles = useMemo(() => buildSubStyles(colors), [colors])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[subStyles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={subStyles.header}>
          <Pressable
            style={subStyles.headerBtn}
            onPress={handleBack}
            disabled={saving}
            hitSlop={8}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : isDirty ? (
              <Text style={subStyles.headerBtnTextAccent}>저장</Text>
            ) : (
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            )}
          </Pressable>
          <Text style={subStyles.headerTitle}>모임 인원 변경</Text>
          <View style={subStyles.headerBtn} />
        </View>

        <View style={subStyles.body}>
          <TextInput
            style={[subStyles.input, !isValid && count !== '' && subStyles.inputError]}
            value={count}
            onChangeText={setCount}
            keyboardType="number-pad"
            editable={!saving}
            placeholder="최대 인원 (2 ~ 1000)"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          {!isValid && count !== '' && (
            <Text style={subStyles.errorText}>2명 이상 1000명 이하로 입력하세요.</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  )
}

// ─────────────────────────────────────────────
// SubView: 가입 신청 인원
// ─────────────────────────────────────────────
function JoinRequestsSubView({
  insets,
  groupId,
  onBack,
}: {
  insets: { top: number; bottom: number }
  groupId: number
  onBack: () => void
}) {
  const { colors } = useTheme()
  const [requests, setRequests] = useState<GroupJoinRequestResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    getPendingJoinRequests(groupId)
      .then(setRequests)
      .catch(e => {
        const msg = e instanceof Error ? e.message : '목록을 불러오지 못했습니다.'
        Alert.alert('오류', msg)
      })
      .finally(() => setLoading(false))
  }, [groupId])

  const handleApprove = async (requestId: number) => {
    setProcessingIds(prev => new Set(prev).add(requestId))
    try {
      await approveJoinRequest(groupId, requestId)
      setRequests(prev => prev.filter(r => r.requestId !== requestId))
    } catch (e) {
      const msg = e instanceof Error ? e.message : '승인에 실패했습니다.'
      Alert.alert('오류', msg)
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(requestId)
        return next
      })
    }
  }

  const handleReject = async (requestId: number) => {
    setProcessingIds(prev => new Set(prev).add(requestId))
    try {
      await rejectJoinRequest(groupId, requestId)
      setRequests(prev => prev.filter(r => r.requestId !== requestId))
    } catch (e) {
      const msg = e instanceof Error ? e.message : '거절에 실패했습니다.'
      Alert.alert('오류', msg)
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(requestId)
        return next
      })
    }
  }

  const subStyles = useMemo(() => buildSubStyles(colors), [colors])
  const requestStyles = useMemo(() => buildRequestStyles(colors), [colors])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[subStyles.container, { paddingTop: insets.top }]}>
        <View style={subStyles.header}>
          <Pressable
            style={subStyles.headerBtn}
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={subStyles.headerTitle}>가입 신청 인원</Text>
          <View style={subStyles.headerBtn} />
        </View>

        {loading ? (
          <View style={subStyles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : requests.length === 0 ? (
          <View style={subStyles.centered}>
            <Text style={subStyles.emptyText}>대기 중인 가입 신청이 없습니다.</Text>
          </View>
        ) : (
          <ScrollView
            style={subStyles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.sp8 }}
            showsVerticalScrollIndicator={false}
          >
            {requests.map(req => {
              const isProcessing = processingIds.has(req.requestId)
              return (
                <View key={req.requestId} style={requestStyles.card}>
                  <View style={requestStyles.row}>
                    <View style={requestStyles.info}>
                      <Text style={requestStyles.nickname}>{req.nickname}</Text>
                      <Text style={requestStyles.date}>{req.createdDate.slice(0, 10)}</Text>
                    </View>
                    <View style={requestStyles.actions}>
                      <Pressable
                        style={({ pressed }) => [
                          requestStyles.btn,
                          requestStyles.approveBtn,
                          pressed && requestStyles.btnPressed,
                          isProcessing && requestStyles.btnDisabled,
                        ]}
                        onPress={() => handleApprove(req.requestId)}
                        disabled={isProcessing}
                        accessibilityRole="button"
                        accessibilityLabel="승인"
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color={colors.bg} />
                        ) : (
                          <Text style={requestStyles.approveBtnText}>승인</Text>
                        )}
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          requestStyles.btn,
                          requestStyles.rejectBtn,
                          pressed && requestStyles.btnPressed,
                          isProcessing && requestStyles.btnDisabled,
                        ]}
                        onPress={() => handleReject(req.requestId)}
                        disabled={isProcessing}
                        accessibilityRole="button"
                        accessibilityLabel="거절"
                      >
                        <Text style={requestStyles.rejectBtnText}>거절</Text>
                      </Pressable>
                    </View>
                  </View>
                  {req.answer ? (
                    <Text style={requestStyles.answer}>{req.answer}</Text>
                  ) : null}
                </View>
              )
            })}
          </ScrollView>
        )}
      </View>
    </>
  )
}

// ─────────────────────────────────────────────
// SubView: 가입 방식
// ─────────────────────────────────────────────
function JoinTypeSubView({
  insets,
  group,
  groupId,
  onBack,
}: {
  insets: { top: number; bottom: number }
  group: GroupDetailResponse
  groupId: number
  onBack: (updatedJoinType?: string, updatedQuestions?: string[]) => void
}) {
  const { colors } = useTheme()
  const [joinType, setJoinType] = useState<'OPEN' | 'APPROVAL_REQUIRED'>(group.joinType)
  const [questions, setQuestions] = useState<string[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [saving, setSaving] = useState(false)

  const originalJoinType = useRef(group.joinType)
  const originalQuestions = useRef<string[]>([])

  // APPROVAL_REQUIRED 선택 시 기존 질문 로드
  useEffect(() => {
    if (joinType === 'APPROVAL_REQUIRED' && questions.length === 0 && !loadingQuestions) {
      setLoadingQuestions(true)
      getGroupJoinQuestions(groupId)
        .then(qs => {
          setQuestions(qs)
          originalQuestions.current = qs
        })
        .catch(() => {
          setQuestions([])
          originalQuestions.current = []
        })
        .finally(() => setLoadingQuestions(false))
    }
  }, [joinType, groupId])

  const joinTypeChanged = joinType !== originalJoinType.current
  const questionsChanged =
    joinType === 'APPROVAL_REQUIRED' &&
    JSON.stringify(questions) !== JSON.stringify(originalQuestions.current)
  const isDirty = joinTypeChanged || questionsChanged

  const handleAddQuestion = () => {
    if (questions.length >= 5) return
    setQuestions(prev => [...prev, ''])
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const handleChangeQuestion = (text: string, index: number) => {
    setQuestions(prev => prev.map((q, i) => (i === index ? text : q)))
  }

  const handleBack = async () => {
    if (!isDirty) {
      onBack()
      return
    }
    setSaving(true)
    try {
      await updateGroup(groupId, {
        name: group.name,
        description: group.description ?? '',
        category: group.category,
        meetingType: group.meetingType,
        region: group.region,
        maxMemberCount: group.maxMemberCount,
        joinType,
      })
      if (joinType === 'APPROVAL_REQUIRED') {
        const filtered = questions.filter(q => q.trim() !== '')
        await updateGroupJoinQuestions(groupId, filtered)
        onBack(joinType, filtered)
      } else {
        onBack(joinType, [])
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다.'
      Alert.alert('오류', msg)
    } finally {
      setSaving(false)
    }
  }

  const subStyles = useMemo(() => buildSubStyles(colors), [colors])
  const joinTypeStyles = useMemo(() => buildJoinTypeStyles(colors), [colors])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[subStyles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={subStyles.header}>
          <Pressable
            style={subStyles.headerBtn}
            onPress={handleBack}
            disabled={saving}
            hitSlop={8}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : isDirty ? (
              <Text style={subStyles.headerBtnTextAccent}>저장</Text>
            ) : (
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            )}
          </Pressable>
          <Text style={subStyles.headerTitle}>가입 방식</Text>
          <View style={subStyles.headerBtn} />
        </View>

        <ScrollView
          style={subStyles.scroll}
          contentContainerStyle={[
            subStyles.bodyPadding,
            { paddingBottom: insets.bottom + spacing.sp8 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 라디오 선택 */}
          <View style={joinTypeStyles.radioGroup}>
            <Pressable
              style={({ pressed }) => [
                joinTypeStyles.radioItem,
                joinType === 'OPEN' && joinTypeStyles.radioItemSelected,
                pressed && joinTypeStyles.radioItemPressed,
              ]}
              onPress={() => setJoinType('OPEN')}
              accessibilityRole="radio"
              accessibilityState={{ checked: joinType === 'OPEN' }}
            >
              <View style={joinTypeStyles.radioCircle}>
                {joinType === 'OPEN' && <View style={joinTypeStyles.radioFill} />}
              </View>
              <View style={joinTypeStyles.radioContent}>
                <Text style={joinTypeStyles.radioLabel}>자유 가입</Text>
                <Text style={joinTypeStyles.radioDesc}>누구든 즉시 가입할 수 있습니다.</Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                joinTypeStyles.radioItem,
                joinType === 'APPROVAL_REQUIRED' && joinTypeStyles.radioItemSelected,
                pressed && joinTypeStyles.radioItemPressed,
              ]}
              onPress={() => setJoinType('APPROVAL_REQUIRED')}
              accessibilityRole="radio"
              accessibilityState={{ checked: joinType === 'APPROVAL_REQUIRED' }}
            >
              <View style={joinTypeStyles.radioCircle}>
                {joinType === 'APPROVAL_REQUIRED' && <View style={joinTypeStyles.radioFill} />}
              </View>
              <View style={joinTypeStyles.radioContent}>
                <Text style={joinTypeStyles.radioLabel}>승인 필요</Text>
                <Text style={joinTypeStyles.radioDesc}>모임장이 신청을 검토 후 승인합니다.</Text>
              </View>
            </Pressable>
          </View>

          {/* 가입 질문 편집 (APPROVAL_REQUIRED 선택 시) */}
          {joinType === 'APPROVAL_REQUIRED' && (
            <View style={joinTypeStyles.questionsSection}>
              <View style={joinTypeStyles.questionHeader}>
                <Text style={joinTypeStyles.questionTitle}>가입 질문</Text>
                <Text style={joinTypeStyles.questionCount}>{questions.length} / 5</Text>
              </View>

              {loadingQuestions ? (
                <ActivityIndicator
                  size="small"
                  color={colors.accent}
                  style={{ marginTop: spacing.sp4 }}
                />
              ) : (
                <>
                  {questions.map((q, index) => (
                    <View key={index} style={joinTypeStyles.questionRow}>
                      <TextInput
                        style={joinTypeStyles.questionInput}
                        value={q}
                        onChangeText={text => handleChangeQuestion(text, index)}
                        placeholder={`질문 ${index + 1}`}
                        placeholderTextColor={colors.textMuted}
                        editable={!saving}
                        maxLength={200}
                      />
                      <Pressable
                        style={joinTypeStyles.removeBtn}
                        onPress={() => handleRemoveQuestion(index)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="질문 삭제"
                      >
                        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  ))}

                  {questions.length < 5 && (
                    <Pressable
                      style={({ pressed }) => [
                        joinTypeStyles.addBtn,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={handleAddQuestion}
                      accessibilityRole="button"
                    >
                      <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                      <Text style={joinTypeStyles.addBtnText}>질문 추가</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}


// ─────────────────────────────────────────────
// 공통 서브뷰 스타일 빌더
// ─────────────────────────────────────────────
function buildSubStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sp2,
      paddingVertical: spacing.sp3,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerBtn: {
      width: 64,
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
    headerBtnTextAccent: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.accent,
    },
    body: { padding: spacing.sp4 },
    bodyPadding: { padding: spacing.sp4 },
    scroll: { flex: 1 },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sp3,
      paddingVertical: spacing.sp3,
      fontSize: fontSize.md,
      color: colors.text,
    },
    inputMultiline: {
      minHeight: 160,
      paddingTop: spacing.sp3,
    },
    inputError: { borderColor: colors.error },
    charCount: {
      marginTop: spacing.sp2,
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'right',
    },
    errorText: {
      marginTop: spacing.sp2,
      fontSize: fontSize.sm,
      color: colors.error,
    },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: fontSize.md, color: colors.textMuted },
  })
}

// ─────────────────────────────────────────────
// 가입 신청 목록 스타일 빌더
// ─────────────────────────────────────────────
function buildRequestStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      marginHorizontal: spacing.sp4,
      marginTop: spacing.sp3,
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sp4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    info: { flex: 1, gap: spacing.sp1 },
    nickname: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    date: { fontSize: fontSize.sm, color: colors.textMuted },
    actions: {
      flexDirection: 'row',
      gap: spacing.sp2,
      marginLeft: spacing.sp3,
    },
    btn: {
      paddingHorizontal: spacing.sp3,
      paddingVertical: spacing.sp2,
      borderRadius: radius.sm,
      minWidth: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    approveBtn: { backgroundColor: colors.accent },
    rejectBtn: {
      backgroundColor: colors.surface3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnPressed: { opacity: 0.75 },
    btnDisabled: { opacity: 0.5 },
    approveBtnText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.bg,
    },
    rejectBtnText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    answer: {
      marginTop: spacing.sp3,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  })
}

// ─────────────────────────────────────────────
// 가입 방식 스타일 빌더
// ─────────────────────────────────────────────
function buildJoinTypeStyles(colors: AppColors) {
  return StyleSheet.create({
    radioGroup: { gap: spacing.sp3 },
    radioItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: spacing.sp4,
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sp3,
    },
    radioItemSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentMuted,
    },
    radioItemPressed: { opacity: 0.75 },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    radioFill: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    radioContent: { flex: 1, gap: spacing.sp1 },
    radioLabel: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    radioDesc: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    questionsSection: { marginTop: spacing.sp5 },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sp3,
    },
    questionTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    questionCount: { fontSize: fontSize.sm, color: colors.textMuted },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sp2,
      marginBottom: spacing.sp2,
    },
    questionInput: {
      flex: 1,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sp3,
      paddingVertical: spacing.sp3,
      fontSize: fontSize.base,
      color: colors.text,
    },
    removeBtn: { padding: spacing.sp1 },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sp2,
      paddingVertical: spacing.sp3,
      marginTop: spacing.sp1,
    },
    addBtnText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.accent,
    },
  })
}
