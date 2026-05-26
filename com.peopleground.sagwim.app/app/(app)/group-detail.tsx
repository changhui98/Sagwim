import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  cancelMyJoinRequest,
  createGroupSchedule,
  getGroup,
  getGroupLikeStatus,
  getGroupMembers,
  getGroupSchedules,
  getMyJoinRequestStatus,
  joinGroup,
  leaveGroup,
  toggleGroupLike,
  toggleScheduleAttendance,
} from '../../src/api/groupApi'
import { createPost, getGroupPosts } from '../../src/api/postApi'
import { getMe } from '../../src/api/userApi'
import type {
  GroupDetailResponse,
  GroupMemberResponse,
  ScheduleCreateRequest,
  ScheduleResponse,
} from '../../src/types/group'
import { GROUP_CATEGORY_LABELS } from '../../src/types/group'
import type { ContentResponse } from '../../src/types/post'
import { resolveImageUrl } from '../../src/lib/resolveImageUrl'
import { colors, fontSize, radius, spacing } from '../../src/constants/theme'
import Holidays from 'date-holidays'

type TabKey = 'schedule' | 'posts' | 'members'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'schedule', label: '일정' },
  { key: 'posts', label: '게시글' },
  { key: 'members', label: '멤버' },
]

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [members, setMembers] = useState<GroupMemberResponse[]>([])
  const [myUsername, setMyUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const isLikeInFlight = useRef(false)

  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<TabKey>('schedule')

  const groupId = Number(id)

  const loadData = useCallback(async () => {
    if (!id || Number.isNaN(groupId)) {
      setError('잘못된 모임 주소입니다.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [groupRes, membersRes, likeRes, joinReqRes, meRes] = await Promise.allSettled([
        getGroup(groupId),
        getGroupMembers(groupId),
        getGroupLikeStatus(groupId).catch(() => ({ liked: false })),
        getMyJoinRequestStatus(groupId).catch(() => ({ pending: false })),
        getMe(),
      ])

      if (groupRes.status === 'fulfilled') {
        setGroup(groupRes.value)
        setLikeCount(groupRes.value.likeCount)
      } else {
        setError('모임 정보를 불러오지 못했어요.')
        return
      }

      if (membersRes.status === 'fulfilled') {
        setMembers(membersRes.value.content)
      }

      if (likeRes.status === 'fulfilled') {
        setLiked(likeRes.value.liked)
      }

      if (joinReqRes.status === 'fulfilled') {
        setHasPendingRequest(joinReqRes.value.pending)
      }

      if (meRes.status === 'fulfilled') {
        setMyUsername(meRes.value.username ?? null)
      }
    } catch (e) {
      console.error('[GroupDetail] loadData 실패:', e)
      setError('모임 정보를 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }, [id, groupId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const isMember = myUsername != null && members.some((m) => m.username === myUsername)
  const isLeader = myUsername != null && group?.leaderUsername === myUsername
  const isFull = group != null && group.currentMemberCount >= group.maxMemberCount

  const handleLike = useCallback(async () => {
    if (!group || isLikeInFlight.current) return
    isLikeInFlight.current = true

    const prevLiked = liked
    const prevCount = likeCount
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)

    try {
      const res = await toggleGroupLike(groupId)
      setLiked(res.liked)
      setLikeCount(res.likeCount)
    } catch (e) {
      console.error('[GroupDetail] toggleGroupLike 실패:', e)
      setLiked(prevLiked)
      setLikeCount(prevCount)
    } finally {
      isLikeInFlight.current = false
    }
  }, [group, liked, likeCount, groupId])

  const handleJoin = useCallback(async () => {
    if (!group) return
    setActionLoading(true)
    try {
      await joinGroup(groupId)
      await loadData()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '모임 가입에 실패했습니다.'
      Alert.alert('가입 실패', msg)
    } finally {
      setActionLoading(false)
    }
  }, [group, groupId, loadData])

  const handleLeave = useCallback(() => {
    Alert.alert('모임 탈퇴', '모임에서 탈퇴하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true)
          try {
            await leaveGroup(groupId)
            await loadData()
          } catch (e) {
            const msg = e instanceof Error ? e.message : '모임 탈퇴에 실패했습니다.'
            Alert.alert('탈퇴 실패', msg)
          } finally {
            setActionLoading(false)
          }
        },
      },
    ])
  }, [groupId, loadData])

  const handleCancelRequest = useCallback(() => {
    Alert.alert('신청 취소', '가입 신청을 취소하시겠습니까?', [
      { text: '닫기', style: 'cancel' },
      {
        text: '취소하기',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true)
          try {
            await cancelMyJoinRequest(groupId)
            setHasPendingRequest(false)
          } catch (e) {
            const msg = e instanceof Error ? e.message : '신청 취소에 실패했습니다.'
            Alert.alert('취소 실패', msg)
          } finally {
            setActionLoading(false)
          }
        },
      },
    ])
  }, [groupId])

  const meetingLabel =
    group?.meetingType === 'OFFLINE' && group.region
      ? `오프라인 · ${group.region}`
      : group?.meetingType === 'OFFLINE'
        ? '오프라인'
        : '온라인'

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
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
            <Text style={styles.headerTitle}>모임</Text>
            <View style={styles.headerBack} />
          </View>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        </View>
      </>
    )
  }

  if (error || !group) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
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
            <Text style={styles.headerTitle}>모임</Text>
            <View style={styles.headerBack} />
          </View>
          <View style={styles.center}>
            <Text style={styles.errorText}>{error ?? '모임을 찾을 수 없어요.'}</Text>
            <Pressable style={styles.errorBack} onPress={() => router.back()}>
              <Text style={styles.errorBackText}>돌아가기</Text>
            </Pressable>
          </View>
        </View>
      </>
    )
  }

  const heroImageUrl = resolveImageUrl(group.imageUrl)

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 헤더 */}
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
          <Text style={styles.headerTitle}>모임</Text>
          {isLeader ? (
            <Pressable
              style={styles.headerBack}
              onPress={() =>
                router.push({ pathname: '/(app)/group-settings', params: { id: String(groupId) } })
              }
              hitSlop={8}
              accessibilityLabel="모임 설정"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </Pressable>
          ) : (
            <View style={styles.headerBack} />
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.sp8 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 히어로 이미지 */}
          <View style={styles.hero}>
            {heroImageUrl ? (
              <Image
                source={heroImageUrl}
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
                accessibilityLabel={`${group.name} 대표 이미지`}
              />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Text style={styles.heroPlaceholderEmoji}>🏠</Text>
              </View>
            )}
          </View>

          {/* 모임 정보 */}
          <View style={styles.info}>
            {/* 배지 행 */}
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {GROUP_CATEGORY_LABELS[group.category]}
                </Text>
              </View>
              <View style={styles.meetingBadge}>
                <Text style={styles.meetingBadgeText}>{meetingLabel}</Text>
              </View>
            </View>

            {/* PENDING 상태 배지 */}
            {group.status === 'PENDING' && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>승인 대기중</Text>
              </View>
            )}

            {/* 모임명 */}
            <Text style={styles.groupName}>{group.name}</Text>

            {/* 멤버 수 */}
            <View style={styles.memberRow}>
              <Ionicons name="people-outline" size={16} color={colors.textMuted} />
              <Text style={styles.memberCount}>
                {group.currentMemberCount}/{group.maxMemberCount}명
              </Text>
            </View>

            {/* 좋아요 */}
            <Pressable
              style={styles.likeRow}
              onPress={() => void handleLike()}
              hitSlop={8}
              accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
              accessibilityRole="button"
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={20}
                color={liked ? colors.error : colors.textMuted}
              />
              <Text style={[styles.likeCount, liked && styles.likeCountActive]}>
                {likeCount}
              </Text>
            </Pressable>

            {/* 설명 */}
            {group.description ? (
              <Text style={styles.description}>{group.description}</Text>
            ) : null}

            {/* 액션 버튼 */}
            {!isLeader && (
              <View style={styles.actionArea}>
                {isMember ? (
                  <Pressable
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={handleLeave}
                    disabled={actionLoading}
                    accessibilityRole="button"
                  >
                    <Text style={styles.actionButtonDangerText}>
                      {actionLoading ? '처리 중...' : '모임 탈퇴'}
                    </Text>
                  </Pressable>
                ) : hasPendingRequest ? (
                  <Pressable
                    style={[styles.actionButton, styles.actionButtonOutline]}
                    onPress={handleCancelRequest}
                    disabled={actionLoading}
                    accessibilityRole="button"
                  >
                    <Text style={styles.actionButtonOutlineText}>
                      {actionLoading ? '처리 중...' : '신청 취소'}
                    </Text>
                  </Pressable>
                ) : isFull ? (
                  <View style={[styles.actionButton, styles.actionButtonDisabled]}>
                    <Text style={styles.actionButtonDisabledText}>정원 초과</Text>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.actionButton, styles.actionButtonPrimary]}
                    onPress={() => void handleJoin()}
                    disabled={actionLoading}
                    accessibilityRole="button"
                  >
                    <Text style={styles.actionButtonPrimaryText}>
                      {actionLoading
                        ? '처리 중...'
                        : group.joinType === 'APPROVAL_REQUIRED'
                          ? '가입 신청'
                          : '모임 가입'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* 구분선 */}
          <View style={styles.divider} />

          {/* 탭 */}
          <View style={styles.tabBar}>
            {TABS.map((tab) => (
              <Pressable
                key={tab.key}
                style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab.key }}
              >
                <Text
                  style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* 탭 콘텐츠 */}
          <View style={styles.tabContent}>
            {activeTab === 'schedule' && (
              <ScheduleTab groupId={groupId} isMember={isMember} myUsername={myUsername} />
            )}
            {activeTab === 'posts' && (
              <PostsTab groupId={groupId} isMember={isMember} />
            )}
            {activeTab === 'members' && (
              <MemberList members={members} leaderUsername={group.leaderUsername} />
            )}
          </View>
        </ScrollView>
      </View>
    </>
  )
}

// ---------------------------------------------------------------------------
// ScheduleTab
// ---------------------------------------------------------------------------

interface ScheduleTabProps {
  groupId: number
  isMember: boolean
  myUsername: string | null
}

function formatScheduleDate(isoString: string): string {
  const d = new Date(isoString)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}월 ${day}일 ${hour}:${min}`
}

function buildCalendarGrid(year: number, month: number) {
  // month는 1-indexed
  const firstDay = new Date(year, month - 1, 1).getDay() // 0=일, 6=토
  const daysInMonth = new Date(year, month, 0).getDate()
  return { firstDay, daysInMonth }
}

interface HolidayInfo {
  name: string
  isSubstitute: boolean
}

function buildKoreanHolidayMap(year: number): Map<string, HolidayInfo> {
  const hd = new Holidays('KR')
  const base = hd
    .getHolidays(year)
    .filter((holiday) => holiday.type === 'public')
    .map((holiday) => ({
      date: holiday.date.slice(0, 10),
      name: holiday.name,
      isSubstitute:
        Boolean((holiday as { substitute?: boolean }).substitute) ||
        holiday.name.includes('대체공휴일'),
    }))

  // 근로자의 날(5/1) 별도 추가
  const laborDay = `${year}-05-01`
  if (!base.some((h) => h.date === laborDay)) {
    base.push({ date: laborDay, name: '근로자의 날', isSubstitute: false })
  }

  const byDate = new Map<string, HolidayInfo>()
  base.forEach((holiday) => {
    byDate.set(holiday.date, { name: holiday.name, isSubstitute: holiday.isSubstitute })
  })

  // 대체공휴일 보강 계산 (어린이날, 석가탄신일이 주말이면 다음 평일)
  const substituteEligible = new Set(['어린이날', '석가탄신일'])
  base.forEach((holiday) => {
    if (!substituteEligible.has(holiday.name)) return
    const dt = new Date(`${holiday.date}T00:00:00`)
    const day = dt.getDay()
    if (day !== 0 && day !== 6) return
    const cursor = new Date(dt)
    while (true) {
      cursor.setDate(cursor.getDate() + 1)
      const dd = cursor.getDay()
      const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
      if (dd === 0 || dd === 6 || byDate.has(dateStr)) continue
      byDate.set(dateStr, { name: `${holiday.name} 대체공휴일`, isSubstitute: true })
      break
    }
  })

  return byDate
}

const PICKER_ITEM_H = 48
const PICKER_SIDE = 2 // 중앙 기준 위아래 보이는 아이템 수
const PICKER_YEARS = Array.from({ length: 41 }, (_, i) => 2000 + i)
const PICKER_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

function ScheduleTab({ groupId, isMember }: ScheduleTabProps) {
  const now = new Date()
  const { width: screenWidth } = useWindowDimensions()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })

  // 년/월 피커
  const [pickerVisible, setPickerVisible] = useState(false)
  const [pickerYear, setPickerYear] = useState(now.getFullYear())
  const [pickerMonth, setPickerMonth] = useState(now.getMonth() + 1)
  const yearScrollRef = useRef<ScrollView>(null)
  const monthScrollRef = useRef<ScrollView>(null)

  // 일정 추가 폼 상태
  const [formTitle, setFormTitle] = useState('')
  const [formStartAt, setFormStartAt] = useState('')
  const [formEndAt, setFormEndAt] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getGroupSchedules(groupId, year, month)
      setSchedules(data)
    } catch (e) {
      console.error('[ScheduleTab] fetchSchedules 실패:', e)
    } finally {
      setLoading(false)
    }
  }, [groupId, year, month])

  useEffect(() => {
    void fetchSchedules()
  }, [fetchSchedules])

  const prevMonth = () => {
    setSelectedDate(null)
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    setSelectedDate(null)
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const openYearMonthPicker = () => {
    setPickerYear(year)
    setPickerMonth(month)
    setPickerVisible(true)
    setTimeout(() => {
      const yi = PICKER_YEARS.indexOf(year)
      const mi = month - 1
      yearScrollRef.current?.scrollTo({ y: yi * PICKER_ITEM_H, animated: false })
      monthScrollRef.current?.scrollTo({ y: mi * PICKER_ITEM_H, animated: false })
    }, 50)
  }

  const handleYearScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / PICKER_ITEM_H)
    const clamped = Math.max(0, Math.min(PICKER_YEARS.length - 1, idx))
    setPickerYear(PICKER_YEARS[clamped])
  }

  const handleMonthScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / PICKER_ITEM_H)
    const clamped = Math.max(0, Math.min(PICKER_MONTHS.length - 1, idx))
    setPickerMonth(PICKER_MONTHS[clamped])
  }

  const confirmYearMonth = () => {
    setSelectedDate(null)
    setYear(pickerYear)
    setMonth(pickerMonth)
    setPickerVisible(false)
  }

  const handleToggleAttendance = async (schedule: ScheduleResponse) => {
    try {
      const res = await toggleScheduleAttendance(groupId, schedule.id)
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === schedule.id
            ? { ...s, attendingByMe: res.attending, attendeeCount: res.attendeeCount }
            : s,
        ),
      )
    } catch (e) {
      Alert.alert('오류', '참석 상태 변경에 실패했습니다.')
    }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormStartAt('')
    setFormEndAt('')
    setFormLocation('')
    setFormDescription('')
  }

  const handleCreateSchedule = async () => {
    if (formTitle.trim().length === 0) {
      Alert.alert('입력 오류', '제목을 입력해주세요.')
      return
    }
    if (formStartAt.trim().length === 0 || formEndAt.trim().length === 0) {
      Alert.alert('입력 오류', '시작 및 종료 일시를 입력해주세요.')
      return
    }
    const req: ScheduleCreateRequest = {
      title: formTitle.trim(),
      startAt: formStartAt.trim(),
      endAt: formEndAt.trim(),
      location: formLocation.trim() || undefined,
      description: formDescription.trim() || undefined,
    }
    setFormSubmitting(true)
    try {
      await createGroupSchedule(groupId, req)
      setModalVisible(false)
      resetForm()
      void fetchSchedules()
    } catch (e) {
      Alert.alert('오류', '일정 생성에 실패했습니다.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const holidayMap = useMemo(() => buildKoreanHolidayMap(year), [year])

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const { firstDay, daysInMonth } = buildCalendarGrid(year, month)
  const CALENDAR_PADDING = spacing.sp4 * 2
  const cellSize = (screenWidth - CALENDAR_PADDING) / 7
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

  // 달력에서 일정이 있는 날짜 집합
  const scheduleDateSet = new Set(
    schedules.map((s) => {
      const d = new Date(s.startAt)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }),
  )

  // selectedDate 기준 필터링
  const visibleSchedules = selectedDate
    ? schedules.filter((s) => {
        const d = new Date(s.startAt)
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return dateStr === selectedDate
      })
    : schedules

  // 날짜 행 배열 구성
  const totalCells = firstDay + daysInMonth
  const rowCount = Math.ceil(totalCells / 7)
  const calendarRows = Array.from({ length: rowCount }, (_, rowIdx) =>
    Array.from({ length: 7 }, (__, colIdx) => {
      const cellIndex = rowIdx * 7 + colIdx
      const day = cellIndex - firstDay + 1
      return day >= 1 && day <= daysInMonth ? day : null
    }),
  )

  const pickerContainerH = PICKER_ITEM_H * (PICKER_SIDE * 2 + 1)
  const pickerPad = PICKER_ITEM_H * PICKER_SIDE

  return (
    <View>
      {/* 월 네비게이션 */}
      <View style={scheduleStyles.monthNav}>
        <Pressable onPress={prevMonth} hitSlop={8} accessibilityLabel="이전 달">
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Pressable
          style={scheduleStyles.monthLabelBtn}
          onPress={openYearMonthPicker}
          accessibilityRole="button"
          accessibilityLabel="년월 선택"
        >
          <Text style={scheduleStyles.monthLabel}>{year}년 {month}월</Text>
          <Ionicons name="chevron-down" size={14} color={colors.accent} />
        </Pressable>
        <Pressable onPress={nextMonth} hitSlop={8} accessibilityLabel="다음 달">
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* 년/월 피커 모달 */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={scheduleStyles.pickerOverlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={scheduleStyles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={scheduleStyles.pickerColumns}>
              {/* 선택 하이라이트 */}
              <View
                pointerEvents="none"
                style={[
                  scheduleStyles.pickerHighlight,
                  { top: pickerPad },
                ]}
              />

              {/* 년도 컬럼 */}
              <ScrollView
                ref={yearScrollRef}
                style={{ flex: 1, height: pickerContainerH }}
                contentContainerStyle={{ paddingVertical: pickerPad }}
                showsVerticalScrollIndicator={false}
                snapToInterval={PICKER_ITEM_H}
                decelerationRate="fast"
                onMomentumScrollEnd={handleYearScroll}
                onScrollEndDrag={handleYearScroll}
              >
                {PICKER_YEARS.map((y) => (
                  <Pressable
                    key={y}
                    style={scheduleStyles.pickerItem}
                    onPress={() => {
                      setPickerYear(y)
                      const idx = PICKER_YEARS.indexOf(y)
                      yearScrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_H, animated: true })
                    }}
                  >
                    <Text
                      style={[
                        scheduleStyles.pickerItemText,
                        y === pickerYear && scheduleStyles.pickerItemTextSelected,
                      ]}
                    >
                      {y}년
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* 월 컬럼 */}
              <ScrollView
                ref={monthScrollRef}
                style={{ flex: 1, height: pickerContainerH }}
                contentContainerStyle={{ paddingVertical: pickerPad }}
                showsVerticalScrollIndicator={false}
                snapToInterval={PICKER_ITEM_H}
                decelerationRate="fast"
                onMomentumScrollEnd={handleMonthScroll}
                onScrollEndDrag={handleMonthScroll}
              >
                {PICKER_MONTHS.map((m) => (
                  <Pressable
                    key={m}
                    style={scheduleStyles.pickerItem}
                    onPress={() => {
                      setPickerMonth(m)
                      const idx = m - 1
                      monthScrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_H, animated: true })
                    }}
                  >
                    <Text
                      style={[
                        scheduleStyles.pickerItemText,
                        m === pickerMonth && scheduleStyles.pickerItemTextSelected,
                      ]}
                    >
                      {m}월
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* 확인 버튼 */}
            <Pressable style={scheduleStyles.pickerConfirmBtn} onPress={confirmYearMonth}>
              <Text style={scheduleStyles.pickerConfirmText}>
                {pickerYear}년 {pickerMonth}월 선택
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 달력 그리드 */}
      <View style={scheduleStyles.calendarGrid}>
        {/* 요일 헤더 */}
        <View style={scheduleStyles.weekdayRow}>
          {WEEKDAYS.map((day, idx) => (
            <Text
              key={day}
              style={[
                scheduleStyles.weekdayCell,
                idx === 0 && { color: colors.error },
                idx === 6 && { color: '#4a90d9' },
              ]}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* 날짜 행 */}
        {calendarRows.map((row, rowIdx) => (
          <View key={rowIdx} style={scheduleStyles.weekRow}>
            {row.map((day, colIdx) => {
              if (day === null) {
                return <View key={colIdx} style={[scheduleStyles.dayCell, { width: cellSize, height: cellSize }]} />
              }
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const hasDot = scheduleDateSet.has(dateStr)
              const isSunday = colIdx === 0
              const isSaturday = colIdx === 6
              const holidayInfo = holidayMap.get(dateStr)
              const holidayName = holidayInfo?.name ?? null
              const isSubstitute = holidayInfo?.isSubstitute ?? false
              const isHoliday = holidayName !== null
              const shortHolidayName = holidayName
                ? holidayName.length > 4
                  ? holidayName.slice(0, 4) + '…'
                  : holidayName
                : null

              let textColor: string = colors.text
              if (isHoliday && isSubstitute) textColor = '#e07c00'
              else if (isHoliday) textColor = colors.error
              else if (isSunday) textColor = colors.error
              else if (isSaturday) textColor = '#4a90d9'

              return (
                <Pressable
                  key={colIdx}
                  style={[
                    scheduleStyles.dayCell,
                    { width: cellSize, height: cellSize },
                    isToday && !isSelected && scheduleStyles.dayCellToday,
                    isSelected && !isToday && scheduleStyles.dayCellSelected,
                    isSelected && isToday && scheduleStyles.dayCellTodaySelected,
                  ]}
                  onPress={() => setSelectedDate(isSelected ? null : dateStr)}
                  accessibilityRole="button"
                  accessibilityLabel={`${month}월 ${day}일`}
                >
                  <Text style={[scheduleStyles.dayCellText, { color: textColor }, (isToday || isSelected) && { fontWeight: '700' }]}>{day}</Text>
                  {shortHolidayName && (
                    <Text
                      style={[
                        scheduleStyles.dayHolidayName,
                        isSubstitute && scheduleStyles.dayHolidayNameSub,
                      ]}
                      numberOfLines={1}
                    >
                      {shortHolidayName}
                    </Text>
                  )}
                  {hasDot && !isSelected && <View style={scheduleStyles.dayCellDot} />}
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>

      {/* 달력-일정 구분선 */}
      <View style={scheduleStyles.calendarDivider} />

      {loading ? (
        <View style={placeholderStyles.wrap}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : visibleSchedules.length === 0 ? (
        <View style={placeholderStyles.wrap}>
          <Ionicons name="calendar-outline" size={32} color={colors.border} />
          <Text style={placeholderStyles.text}>
            {selectedDate ? '이 날 일정이 없어요.' : '이번 달 일정이 없어요.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleSchedules}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={scheduleStyles.separator} />}
          renderItem={({ item }) => (
            <View style={scheduleStyles.item}>
              <View style={scheduleStyles.itemMain}>
                <Text style={scheduleStyles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={scheduleStyles.itemDate}>{formatScheduleDate(item.startAt)}</Text>
                {item.location ? (
                  <Text style={scheduleStyles.itemLocation} numberOfLines={1}>
                    <Ionicons name="location-outline" size={12} color={colors.textMuted} />{' '}
                    {item.location}
                  </Text>
                ) : null}
                <Text style={scheduleStyles.itemAttendee}>
                  참석자 {item.attendeeCount}명
                </Text>
              </View>
              {isMember && (
                <Pressable
                  style={[
                    scheduleStyles.attendBtn,
                    item.attendingByMe && scheduleStyles.attendBtnActive,
                  ]}
                  onPress={() => void handleToggleAttendance(item)}
                  accessibilityRole="button"
                  accessibilityLabel={item.attendingByMe ? '참석 취소' : '참석'}
                >
                  <Text
                    style={[
                      scheduleStyles.attendBtnText,
                      item.attendingByMe && scheduleStyles.attendBtnTextActive,
                    ]}
                  >
                    {item.attendingByMe ? '참석 취소' : '참석'}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}

      {/* 멤버인 경우 일정 추가 버튼 */}
      {isMember && (
        <Pressable
          style={scheduleStyles.addBtn}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="일정 추가"
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
          <Text style={scheduleStyles.addBtnText}>일정 추가</Text>
        </Pressable>
      )}

      {/* 일정 추가 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.sheetHeader}>
              <Text style={modalStyles.sheetTitle}>일정 추가</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView
              style={modalStyles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={modalStyles.label}>
                제목 <Text style={modalStyles.required}>*</Text>
              </Text>
              <TextInput
                style={modalStyles.input}
                placeholder="일정 제목"
                placeholderTextColor={colors.textMuted}
                value={formTitle}
                onChangeText={setFormTitle}
              />
              <Text style={modalStyles.label}>
                시작 일시 <Text style={modalStyles.required}>*</Text>
              </Text>
              <TextInput
                style={modalStyles.input}
                placeholder="2025-06-01T14:00"
                placeholderTextColor={colors.textMuted}
                value={formStartAt}
                onChangeText={setFormStartAt}
              />
              <Text style={modalStyles.label}>
                종료 일시 <Text style={modalStyles.required}>*</Text>
              </Text>
              <TextInput
                style={modalStyles.input}
                placeholder="2025-06-01T16:00"
                placeholderTextColor={colors.textMuted}
                value={formEndAt}
                onChangeText={setFormEndAt}
              />
              <Text style={modalStyles.label}>장소 (선택)</Text>
              <TextInput
                style={modalStyles.input}
                placeholder="장소를 입력해주세요"
                placeholderTextColor={colors.textMuted}
                value={formLocation}
                onChangeText={setFormLocation}
              />
              <Text style={modalStyles.label}>설명 (선택)</Text>
              <TextInput
                style={[modalStyles.input, modalStyles.inputMultiline]}
                placeholder="일정 설명"
                placeholderTextColor={colors.textMuted}
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                textAlignVertical="top"
              />
              <Pressable
                style={[modalStyles.submitBtn, formSubmitting && modalStyles.submitBtnDisabled]}
                onPress={() => void handleCreateSchedule()}
                disabled={formSubmitting}
                accessibilityRole="button"
              >
                <Text style={modalStyles.submitBtnText}>
                  {formSubmitting ? '생성 중...' : '일정 추가'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ---------------------------------------------------------------------------
// PostsTab
// ---------------------------------------------------------------------------

interface PostsTabProps {
  groupId: number
  isMember: boolean
}

function formatPostDate(isoString: string): string {
  const d = new Date(isoString)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
}

function PostsTab({ groupId, isMember }: PostsTabProps) {
  const [posts, setPosts] = useState<ContentResponse[]>([])
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const [modalVisible, setModalVisible] = useState(false)
  const [postBody, setPostBody] = useState('')
  const [postSubmitting, setPostSubmitting] = useState(false)

  const fetchPosts = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      try {
        const res = await getGroupPosts(groupId, targetPage, 10)
        setPosts((prev) => (append ? [...prev, ...res.content] : res.content))
        setPage(res.page)
        setHasNext(res.hasNext)
      } catch (e) {
        console.error('[PostsTab] fetchPosts 실패:', e)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [groupId],
  )

  useEffect(() => {
    void fetchPosts(0, false)
  }, [fetchPosts])

  const handleLoadMore = () => {
    if (!hasNext || loadingMore) return
    void fetchPosts(page + 1, true)
  }

  const handleCreatePost = async () => {
    if (postBody.trim().length === 0) {
      Alert.alert('입력 오류', '내용을 입력해주세요.')
      return
    }
    setPostSubmitting(true)
    try {
      await createPost({ body: postBody.trim(), groupId })
      setModalVisible(false)
      setPostBody('')
      void fetchPosts(0, false)
    } catch (e) {
      Alert.alert('오류', '게시글 작성에 실패했습니다.')
    } finally {
      setPostSubmitting(false)
    }
  }

  return (
    <View>
      {loading ? (
        <View style={placeholderStyles.wrap}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : posts.length === 0 ? (
        <>
          <View style={placeholderStyles.wrap}>
            <Ionicons name="document-text-outline" size={32} color={colors.border} />
            <Text style={placeholderStyles.text}>아직 게시글이 없어요.</Text>
          </View>
          {isMember && (
            <Pressable
              style={postsStyles.addBtn}
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="게시글 작성"
            >
              <Ionicons name="pencil-outline" size={18} color={colors.accent} />
              <Text style={postsStyles.addBtnText}>게시글 작성</Text>
            </Pressable>
          )}
        </>
      ) : (
        <>
          {isMember && (
            <Pressable
              style={postsStyles.writeBtn}
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="게시글 작성"
            >
              <Ionicons name="pencil-outline" size={16} color={colors.accent} />
              <Text style={postsStyles.writeBtnText}>게시글 작성</Text>
            </Pressable>
          )}
          <FlatList
            data={posts}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={postsStyles.separator} />}
            renderItem={({ item }) => (
              <View style={postsStyles.item}>
                <View style={postsStyles.itemHeader}>
                  <Text style={postsStyles.nickname}>{item.nickname ?? item.createdBy}</Text>
                  <Text style={postsStyles.date}>{formatPostDate(item.createdAt)}</Text>
                </View>
                <Text style={postsStyles.body} numberOfLines={2}>
                  {item.body}
                </Text>
                <View style={postsStyles.itemFooter}>
                  <Ionicons name="heart-outline" size={14} color={colors.textMuted} />
                  <Text style={postsStyles.footerCount}>{item.likeCount ?? 0}</Text>
                  <Ionicons
                    name="chatbubble-outline"
                    size={14}
                    color={colors.textMuted}
                    style={{ marginLeft: spacing.sp2 }}
                  />
                  <Text style={postsStyles.footerCount}>{item.commentCount ?? 0}</Text>
                </View>
              </View>
            )}
          />
          {hasNext && (
            <Pressable
              style={postsStyles.moreBtn}
              onPress={handleLoadMore}
              disabled={loadingMore}
              accessibilityRole="button"
            >
              <Text style={postsStyles.moreBtnText}>
                {loadingMore ? '불러오는 중...' : '더 보기'}
              </Text>
            </Pressable>
          )}
        </>
      )}

      {/* 게시글 작성 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.sheetHeader}>
              <Text style={modalStyles.sheetTitle}>게시글 작성</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView
              style={modalStyles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[modalStyles.input, modalStyles.inputMultiline]}
                placeholder="이웃들에게 이야기를 나눠보세요..."
                placeholderTextColor={colors.textMuted}
                value={postBody}
                onChangeText={setPostBody}
                multiline
                textAlignVertical="top"
                autoFocus
              />
              <Pressable
                style={[
                  modalStyles.submitBtn,
                  (postSubmitting || postBody.trim().length === 0) && modalStyles.submitBtnDisabled,
                ]}
                onPress={() => void handleCreatePost()}
                disabled={postSubmitting || postBody.trim().length === 0}
                accessibilityRole="button"
              >
                <Text style={modalStyles.submitBtnText}>
                  {postSubmitting ? '등록 중...' : '등록'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ---------------------------------------------------------------------------

function TabPlaceholder() {
  return (
    <View style={placeholderStyles.wrap}>
      <Ionicons name="hourglass-outline" size={32} color={colors.border} />
      <Text style={placeholderStyles.text}>준비 중이에요.</Text>
    </View>
  )
}

interface MemberListProps {
  members: GroupMemberResponse[]
  leaderUsername: string
}

function MemberList({ members, leaderUsername }: MemberListProps) {
  if (members.length === 0) {
    return (
      <View style={placeholderStyles.wrap}>
        <Ionicons name="people-outline" size={32} color={colors.border} />
        <Text style={placeholderStyles.text}>멤버 정보가 없어요.</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.userId}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={memberStyles.separator} />}
      renderItem={({ item }) => {
        const initial = item.nickname.slice(0, 1).toUpperCase()
        const isLeaderItem = item.username === leaderUsername

        return (
          <View style={memberStyles.row}>
            <View style={memberStyles.avatar}>
              <Text style={memberStyles.avatarText}>{initial}</Text>
            </View>
            <Text style={memberStyles.nickname} numberOfLines={1}>
              {item.nickname}
            </Text>
            {isLeaderItem && (
              <View style={memberStyles.leaderBadge}>
                <Text style={memberStyles.leaderBadgeText}>모임장</Text>
              </View>
            )}
            {!isLeaderItem && (
              <View style={memberStyles.memberBadge}>
                <Text style={memberStyles.memberBadgeText}>멤버</Text>
              </View>
            )}
          </View>
        )
      }}
    />
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sp6,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sp4,
  },
  errorBack: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sp6,
    paddingVertical: spacing.sp3,
    borderRadius: radius.md,
  },
  errorBackText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  hero: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface3,
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderEmoji: {
    fontSize: 48,
  },
  info: {
    paddingHorizontal: spacing.sp4,
    paddingTop: spacing.sp4,
    gap: spacing.sp3,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sp2,
  },
  categoryBadge: {
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sp2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  categoryBadgeText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  meetingBadge: {
    backgroundColor: colors.surface3,
    paddingHorizontal: spacing.sp2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  meetingBadgeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sp2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  pendingBadgeText: {
    fontSize: fontSize.sm,
    color: '#fff',
    fontWeight: '700',
  },
  groupName: {
    fontSize: fontSize.xl2,
    fontWeight: '700',
    color: colors.text,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp1,
  },
  memberCount: {
    fontSize: fontSize.base,
    color: colors.textMuted,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp1,
    alignSelf: 'flex-start',
  },
  likeCount: {
    fontSize: fontSize.base,
    color: colors.textMuted,
  },
  likeCountActive: {
    color: colors.error,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: fontSize.md * 1.6,
  },
  actionArea: {
    marginTop: spacing.sp2,
  },
  actionButton: {
    paddingVertical: spacing.sp3,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: colors.accent,
  },
  actionButtonPrimaryText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  actionButtonDanger: {
    backgroundColor: colors.errorSoft,
  },
  actionButtonDangerText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.error,
  },
  actionButtonOutline: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonOutlineText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionButtonDisabled: {
    backgroundColor: colors.surface3,
  },
  actionButtonDisabledText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
  },
  divider: {
    height: 8,
    backgroundColor: colors.surface3,
    marginTop: spacing.sp4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.sp3,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.accent,
  },
  tabLabel: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  tabContent: {
    minHeight: 200,
  },
})

const placeholderStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sp3,
    paddingVertical: spacing.sp8,
  },
  text: {
    fontSize: fontSize.base,
    color: colors.textMuted,
  },
})

const scheduleStyles = StyleSheet.create({
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthLabelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp1,
  },
  monthLabel: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sp4,
    overflow: 'hidden',
  },
  pickerColumns: {
    flexDirection: 'row',
    position: 'relative',
  },
  pickerHighlight: {
    position: 'absolute',
    left: spacing.sp4,
    right: spacing.sp4,
    height: PICKER_ITEM_H,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    zIndex: 0,
  },
  pickerItem: {
    height: PICKER_ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  pickerItemTextSelected: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  pickerConfirmBtn: {
    margin: spacing.sp4,
    paddingVertical: spacing.sp4,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  pickerConfirmText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  calendarGrid: {
    paddingHorizontal: spacing.sp4,
    paddingTop: spacing.sp2,
    paddingBottom: spacing.sp2,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sp1,
  },
  weekdayCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingVertical: spacing.sp1,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.sp1,
  },
  dayCellToday: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
  },
  dayCellSelected: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.md,
  },
  dayCellTodaySelected: {
    backgroundColor: colors.accentMuted,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.md,
  },
  dayCellText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  dayCellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 2,
  },
  dayHolidayName: {
    fontSize: 8,
    color: colors.error,
    textAlign: 'center',
    lineHeight: 10,
  },
  dayHolidayNameSub: {
    color: '#e07c00',
  },
  calendarDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sp4,
    marginBottom: spacing.sp1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sp4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp3,
    gap: spacing.sp3,
  },
  itemMain: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  itemDate: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  itemLocation: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  itemAttendee: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  attendBtn: {
    paddingHorizontal: spacing.sp3,
    paddingVertical: spacing.sp2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  attendBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  attendBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  attendBtnTextActive: {
    color: colors.accent,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sp2,
    paddingVertical: spacing.sp3,
    marginHorizontal: spacing.sp4,
    marginTop: spacing.sp3,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.accent,
  },
})

const postsStyles = StyleSheet.create({
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sp2,
    paddingVertical: spacing.sp3,
    marginHorizontal: spacing.sp4,
    marginBottom: spacing.sp2,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
  },
  writeBtnText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.accent,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sp2,
    paddingVertical: spacing.sp3,
    marginHorizontal: spacing.sp4,
    marginTop: spacing.sp3,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.accent,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sp4,
  },
  item: {
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp3,
    gap: spacing.sp2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nickname: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: fontSize.md * 1.5,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp1,
  },
  footerCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  moreBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sp3,
    marginTop: spacing.sp2,
  },
  moreBtnText: {
    fontSize: fontSize.base,
    color: colors.accent,
    fontWeight: '600',
  },
})

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    padding: spacing.sp4,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sp2,
    marginTop: spacing.sp3,
  },
  required: {
    color: colors.accent,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sp3,
    paddingVertical: spacing.sp3,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface2,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: spacing.sp3,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.sp4,
    alignItems: 'center',
    marginTop: spacing.sp5,
    marginBottom: spacing.sp4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
})

const memberStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp3,
    gap: spacing.sp3,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sp4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.accent,
  },
  nickname: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  leaderBadge: {
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sp2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  leaderBadgeText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '700',
  },
  memberBadge: {
    backgroundColor: colors.surface3,
    paddingHorizontal: spacing.sp2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  memberBadgeText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
})
