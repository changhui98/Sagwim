import { useEffect, useState } from 'react'
import { getAdminUsers } from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { Skeleton } from '../../components/common/Skeleton'
import { getInitials } from '../../utils/stringUtils'
import type { UserResponse } from '../../types/user'
import styles from './AdminDashboardPage.module.css'

export function AdminDashboardPage() {
  const { token, meUsername, meProfileImageUrl } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [recentUsers, setRecentUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const recentRes = await getAdminUsers(token, 0, 5)
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

  return (
    <div className={styles.container}>
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
