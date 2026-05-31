/**
 * 모바일 홈 — 웹 GroupListPage 의 모바일 이식 (Step 1).
 *
 * 구성:
 *  - 상단 헤더: 비움 (Step 1 결정)
 *  - 주소 분기: meAddress 없으면 AddressOnboarding 노출
 *  - 5개 섹션 (가로 스크롤 3장 미리보기):
 *    · 갓 피어난 모임 (GET /groups/recent)
 *    · 요즘 북적이는 모임 (GET /groups/popular)
 *    · 마감 임박 모임 (Step 1: 빈 상태 UI)
 *    · 이번 주에 만나요 (Step 1: 빈 상태 UI)
 *    · {동 이름} 모든 모임 (GET /groups)
 *  - Pull-to-refresh 지원
 */

import React, { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { getNewGroups, getPopularGroups, getGroups } from '../../../src/api/groupApi'
import { consumeGroupsDirty } from '../../../src/lib/listRefresh'
import { getMe } from '../../../src/api/userApi'
import { useAuth } from '../../../src/context/AuthContext'
import { GroupSection } from '../../../src/components/group/GroupSection'
import { AddressOnboarding } from '../../../src/components/home/AddressOnboarding'
import type { GroupResponse } from '../../../src/types/group'
import type { UserDetailResponse } from '../../../src/types/user'
import { spacing } from '../../../src/constants/theme'
import { useTheme } from '../../../src/context/ThemeContext'

const PREVIEW_COUNT = 3

function extractDong(address: string | null | undefined): string {
  if (!address) return '우리 동네'
  const parts = address.trim().split(/\s+/)
  return parts[parts.length - 1] || '우리 동네'
}

export default function HomeScreen() {
  const { isAuthenticated } = useAuth()
  const { colors } = useTheme()

  const [address, setAddress] = useState<string | null | undefined>(undefined)
  const [meProfile, setMeProfile] = useState<UserDetailResponse | null>(null)
  const [newGroups, setNewGroups] = useState<GroupResponse[]>([])
  const [popularGroups, setPopularGroups] = useState<GroupResponse[]>([])
  const [neighborhoodGroups, setNeighborhoodGroups] = useState<GroupResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAll = useCallback(async () => {
    try {
      const [meRes, newRes, popularRes, neighborhoodRes] = await Promise.allSettled([
        getMe(),
        getNewGroups(0, 20),
        getPopularGroups(0, 20),
        getGroups(0, 20),
      ])

      if (meRes.status === 'fulfilled') {
        setAddress(meRes.value.address ?? null)
        setMeProfile(meRes.value)
      } else {
        setAddress(null)
        setMeProfile(null)
      }

      setNewGroups(
        newRes.status === 'fulfilled' ? newRes.value.content.slice(0, PREVIEW_COUNT) : [],
      )
      setPopularGroups(
        popularRes.status === 'fulfilled' ? popularRes.value.content.slice(0, PREVIEW_COUNT) : [],
      )
      setNeighborhoodGroups(
        neighborhoodRes.status === 'fulfilled' ? neighborhoodRes.value.content : [],
      )
    } finally {
      setLoading(false)
      setNeighborhoodLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    void loadAll()
  // loadAll은 [] deps라 안정적 — React Compiler가 unstable하게 처리할 경우를 방지
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // 모임 생성 후 홈 탭으로 돌아오면 dirty 플래그를 소비해 조용히 재조회한다.
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && consumeGroupsDirty()) {
        void loadAll()
      }
    }, [isAuthenticated, loadAll]),
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    void loadAll()
  }, [loadAll])

  const handlePressGroup = (groupId: number) => {
    router.push({ pathname: '/(app)/group-detail', params: { id: String(groupId) } })
  }

  // 주소 분기: meAddress 없으면 온보딩만 노출
  if (!loading && !address) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AddressOnboarding
          onPressSetAddress={() => {
            router.push({
              pathname: '/(app)/profile-edit-address',
              params: { profile: JSON.stringify(meProfile ?? {}) },
            })
          }}
        />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <GroupSection
          title={`${extractDong(address)} 모든 모임`}
          subtitle="우리 동네 모임, 여기 다 있어요"
          groups={neighborhoodGroups.slice(0, PREVIEW_COUNT)}
          loading={neighborhoodLoading}
          emptyMessage="노출 범위 내 모임이 아직 없어요."
          onPressGroup={handlePressGroup}
          onPressMore={() =>
            router.push({
              pathname: '/(app)/group-list',
              params: { title: `${extractDong(address)} 모든 모임` },
            })
          }
        />

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
          emptyMessage="아직 인기 모임이 없어요."
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sp4,
    paddingBottom: spacing.sp8,
  },
})
