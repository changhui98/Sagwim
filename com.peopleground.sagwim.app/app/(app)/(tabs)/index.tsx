/**
 * 모바일 홈 — 웹 GroupListPage 의 모바일 이식 (Step 1).
 *
 * 구성:
 *  - 상단 헤더: 비움 (Step 1 결정)
 *  - 주소 분기: meAddress 없으면 AddressOnboarding 노출
 *  - 4개 섹션 (가로 스크롤 3장 미리보기):
 *    · 갓 피어난 모임 (GET /groups/recent)
 *    · 요즘 북적이는 모임 (GET /groups/popular)
 *    · 마감 임박 모임 (Step 1: 빈 상태 UI)
 *    · 이번 주에 만나요 (Step 1: 빈 상태 UI)
 *  - Pull-to-refresh 지원
 */

import React, { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { getNewGroups, getPopularGroups } from '../../../src/api/groupApi'
import { getMe } from '../../../src/api/userApi'
import { useAuth } from '../../../src/context/AuthContext'
import { GroupSection } from '../../../src/components/group/GroupSection'
import { AddressOnboarding } from '../../../src/components/home/AddressOnboarding'
import type { GroupResponse } from '../../../src/types/group'
import { colors, spacing } from '../../../src/constants/theme'

const PREVIEW_COUNT = 3

export default function HomeScreen() {
  const { isAuthenticated } = useAuth()

  const [address, setAddress] = useState<string | null | undefined>(undefined)
  const [newGroups, setNewGroups] = useState<GroupResponse[]>([])
  const [popularGroups, setPopularGroups] = useState<GroupResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAll = useCallback(async () => {
    try {
      const [meRes, newRes, popularRes] = await Promise.allSettled([
        getMe(),
        getNewGroups(0, 20),
        getPopularGroups(0, 20),
      ])

      if (meRes.status === 'fulfilled') {
        setAddress(meRes.value.address ?? null)
      } else {
        setAddress(null)
      }

      setNewGroups(
        newRes.status === 'fulfilled' ? newRes.value.content.slice(0, PREVIEW_COUNT) : [],
      )
      setPopularGroups(
        popularRes.status === 'fulfilled' ? popularRes.value.content.slice(0, PREVIEW_COUNT) : [],
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    void loadAll()
  }, [isAuthenticated, loadAll])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    void loadAll()
  }, [loadAll])

  const handlePressGroup = (groupId: number) => {
    // 모임 상세 화면은 Step 3 에서 구현 예정.
    // 지금은 console 로 의도만 표시.
    console.log('[Home] group press:', groupId)
  }

  // 주소 분기: meAddress 없으면 온보딩만 노출
  if (!loading && !address) {
    return (
      <View style={styles.safe}>
        <AddressOnboarding
          onPressSetAddress={() => {
            // 주소 설정 화면도 추후 단계 — 우선 임시 알림 처리.
            console.log('[Home] navigate to address setup — pending')
          }}
        />
      </View>
    )
  }

  return (
    <View style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <GroupSection
          title="갓 피어난 모임"
          groups={newGroups}
          loading={loading}
          emptyMessage="새로 만들어진 모임이 아직 없어요."
          onPressGroup={handlePressGroup}
          onPressMore={() => console.log('[Home] more recent — pending')}
        />

        <GroupSection
          title="요즘 북적이는 모임"
          groups={popularGroups}
          loading={loading}
          emptyMessage="인기 모임 데이터를 불러오는 중이에요."
          onPressGroup={handlePressGroup}
          onPressMore={() => console.log('[Home] more popular — pending')}
        />

        <GroupSection
          title="마감 임박 모임"
          groups={[]}
          loading={false}
          emptyMessage="마감 임박 모임 기능은 준비 중이에요."
          onPressGroup={handlePressGroup}
        />

        <GroupSection
          title="이번 주에 만나요"
          groups={[]}
          loading={false}
          emptyMessage="이번 주 일정 기능은 준비 중이에요."
          onPressGroup={handlePressGroup}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sp4,
    paddingBottom: spacing.sp8,
  },
})
