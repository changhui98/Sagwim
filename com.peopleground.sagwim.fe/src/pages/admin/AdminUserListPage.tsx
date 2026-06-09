import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changeUserRole, getAdminUsers } from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { RoleDropdown } from '../../components/admin/RoleDropdown'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Skeleton } from '../../components/common/Skeleton'
import { Pagination } from '../../components/common/Pagination'
import { getInitials } from '../../utils/stringUtils'
import { formatDateTime } from '../../utils/dateUtils'
import type { UserResponse, UserRole } from '../../types/user'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminUserListPage.module.css'

const PAGE_SIZE = 10

const SEARCH_FIELDS = [
  { value: 'ALL', label: '통합' },
  { value: 'NICKNAME', label: '닉네임' },
  { value: 'EMAIL', label: '이메일' },
  { value: 'USERNAME', label: '아이디' },
] as const

function RoleBadge({ role }: { role?: UserRole }) {
  if (role === 'ADMIN') return <span className={pageStyles.badgeRoleAdmin}>ADMIN</span>
  if (role === 'MANAGER') return <span className={pageStyles.badgeRoleManager}>MANAGER</span>
  return <span className={pageStyles.badgeRoleUser}>USER</span>
}

export function AdminUserListPage() {
  const navigate = useNavigate()
  const { token, meUsername, meRole, meProfileImageUrl } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [users, setUsers] = useState<UserResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searchField, setSearchField] = useState('ALL')
  const debouncedKeyword = useDebouncedValue(keyword)

  const [roleChangingUsername, setRoleChangingUsername] = useState<string | null>(null)

  const loadUsers = useCallback(
    async (targetPage: number, searchKeyword: string, field: string) => {
      try {
        setLoading(true)
        setError('')
        const response = await getAdminUsers(token, targetPage, PAGE_SIZE, searchKeyword, field)
        const sortedUsers = [...response.content].sort((a, b) => {
          const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0
          const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0
          return bTime - aTime
        })
        setUsers(sortedUsers)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (err) {
        const message = err instanceof Error ? err.message : '사용자 목록 조회 실패'
        setError(message)
        handleUnauthorized(err)
      } finally {
        setLoading(false)
        setInitialLoad(false)
      }
    },
    [token, handleUnauthorized],
  )

  useEffect(() => {
    setPage(0)
    loadUsers(0, debouncedKeyword, searchField)
  }, [debouncedKeyword, searchField, loadUsers])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadUsers(nextPage, debouncedKeyword, searchField)
  }

  const handleRoleChange = async (user: UserResponse, newRole: UserRole) => {
    if (roleChangingUsername) return
    try {
      setRoleChangingUsername(user.username)
      await changeUserRole(token, user.username, { role: newRole })
      setUsers((prev) =>
        prev.map((u) => (u.username === user.username ? { ...u, role: newRole } : u)),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : '역할 변경 실패'
      setError(message)
      handleUnauthorized(err)
    } finally {
      setRoleChangingUsername(null)
    }
  }

  return (
    <div className={pageStyles.container}>
      <AdminPageHeader
        title="사용자 관리"
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="검색어 입력"
        searchFields={SEARCH_FIELDS}
        searchField={searchField}
        onSearchFieldChange={setSearchField}
      />

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <div className={tableStyles.tableCard}>
        {initialLoad ? (
          <div style={{ padding: 'var(--sp-6)' }}>
            <Skeleton height="300px" />
          </div>
        ) : (
          <>
            <div className={tableStyles.totalCount}>총 {totalElements.toLocaleString()}명</div>
            <div className={tableStyles.tableWrap} style={{ position: 'relative' }}>
              {loading && <LoadingSpinner overlay />}
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>닉네임</th>
                    <th>아이디</th>
                    <th>이메일</th>
                    <th>가입 경로</th>
                    <th>역할</th>
                    <th>가입일</th>
                    <th>수정일</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr className={tableStyles.emptyRow}>
                      <td colSpan={8}>등록된 사용자가 없습니다.</td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const avatarSrc =
                        user.profileImageUrl?.trim() ||
                        (user.username === meUsername ? meProfileImageUrl?.trim() ?? '' : '')
                      const isMyself = user.username === meUsername
                      const isRoleChanging = roleChangingUsername === user.username
                      const canChangeRole = meRole === 'ADMIN' && !isMyself && !user.isDeleted
                      return (
                      <tr
                        key={user.id}
                        className={pageStyles.userRow}
                        onClick={() => navigate(`/app/admin/users/${user.username}`)}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="avatar avatar-md">
                              {avatarSrc ? (
                                <img
                                  src={avatarSrc}
                                  alt={`${user.nickname} 프로필`}
                                  className={pageStyles.avatarImage}
                                />
                              ) : (
                                getInitials(user.nickname)
                              )}
                            </span>
                            <span className={tableStyles.tableUsername}>
                              {user.nickname}
                            </span>
                          </div>
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          {user.username}
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          <span
                            className={tableStyles.truncateCell}
                            style={{ maxWidth: 200 }}
                            title={user.userEmail}
                          >
                            {user.userEmail}
                          </span>
                        </td>
                        <td>
                          {user.provider === 'KAKAO' ? (
                            <span className={tableStyles.badgeKakao}>KAKAO</span>
                          ) : user.provider === 'GOOGLE' ? (
                            <span className={tableStyles.badgeGoogle}>GOOGLE</span>
                          ) : (
                            <span className={tableStyles.badgeLocal}>일반</span>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {canChangeRole ? (
                            <RoleDropdown
                              role={user.role ?? 'USER'}
                              disabled={isRoleChanging}
                              onChange={(newRole) => handleRoleChange(user, newRole)}
                            />
                          ) : (
                            <RoleBadge role={user.role} />
                          )}
                        </td>
                        <td className={tableStyles.tableDate}>
                          {formatDateTime(user.createdDate)}
                        </td>
                        <td className={tableStyles.tableDate}>
                          {formatDateTime(user.modifiedDate)}
                        </td>
                        <td>
                          {user.isDeleted ? (
                            <span className={tableStyles.badgeDeleted}>탈퇴</span>
                          ) : (
                            <span className={tableStyles.badgeActive}>활성</span>
                          )}
                        </td>
                      </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disabled={loading}
            />
          </>
        )}
      </div>
    </div>
  )
}
