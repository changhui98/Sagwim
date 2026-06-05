import { useEffect, useState } from 'react'
import { getAdminUsers, getMonthlyContentCreations } from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { StatCard } from '../../components/admin/StatCard'
import { Skeleton } from '../../components/common/Skeleton'
import { getInitials } from '../../utils/stringUtils'
import type { UserResponse } from '../../types/user'
import type { MonthlyStatsPoint } from '../../types/adminStats'
import styles from './AdminDashboardPage.module.css'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', { hour12: false })
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const day = DAY_NAMES[date.getDay()]
  return `${y}년 ${m}월 ${d}일 (${day})`
}

export function AdminDashboardPage() {
  const { token, meUsername, meProfileImageUrl } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [recentUsers, setRecentUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)

  const [contentStats, setContentStats] = useState<MonthlyStatsPoint[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [countRes, recentRes] = await Promise.all([
          getAdminUsers(token, 0, 1),
          getAdminUsers(token, 0, 5),
        ])
        setTotalUsers(countRes.totalElements)
        const sortedRecentUsers = [...recentRes.content].sort((a, b) => {
          const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0
          const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0
          return bTime - aTime
        })
        setRecentUsers(sortedRecentUsers)
      } catch (err) {
        handleUnauthorized(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [token, handleUnauthorized])

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true)
        const contentRes = await getMonthlyContentCreations(token, 12)
        setContentStats(contentRes.points)
      } catch (err) {
        console.error('[admin] 게시글 통계 로드 실패:', err)
        handleUnauthorized(err)
      } finally {
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [token, handleUnauthorized])

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <StatCard
          title="현재 시간"
          value={formatTime(currentTime)}
          subtitle={formatDate(currentTime)}
          accent
          className={styles.timeCard}
        />
        <StatCard
          title="전체 사용자"
          value={totalUsers !== null ? `${totalUsers}명` : '-'}
          subtitle="등록된 전체 사용자 수"
          loading={loading}
          accent
        />
        <StatCard
          title="최근 12개월 게시글"
          value={
            contentStats.length > 0
              ? `${contentStats.reduce((s, p) => s + p.count, 0)}건`
              : '-'
          }
          subtitle="최근 12개월간 작성된 게시글"
          loading={statsLoading}
        />
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>최근 가입 사용자</h2>
        {loading ? (
          <Skeleton height="200px" />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>닉네임</th>
                <th>이메일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                    사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => {
                  const avatarSrc =
                    user.profileImageUrl?.trim() ||
                    (user.username === meUsername ? meProfileImageUrl?.trim() ?? '' : '')
                  return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="avatar avatar-md">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={`${user.nickname} 프로필`}
                              className={styles.avatarImage}
                            />
                          ) : (
                            getInitials(user.nickname)
                          )}
                        </span>
                        <span className="font-semibold">{user.nickname}</span>
                      </div>
                    </td>
                    <td>{user.userEmail}</td>
                    <td>
                      {user.isDeleted ? (
                        <span className={`badge ${styles.badgeDeleted}`}>탈퇴</span>
                      ) : (
                        <span className="badge badge-success">활성</span>
                      )}
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
