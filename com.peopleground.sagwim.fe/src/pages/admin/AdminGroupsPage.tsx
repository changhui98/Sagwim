import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminGroups } from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Skeleton } from '../../components/common/Skeleton'
import { Pagination } from '../../components/common/Pagination'
import { formatDateTime } from '../../utils/dateUtils'
import { extractLastTwoRegionTokens } from '../../utils/stringUtils'
import type { AdminGroupResponse, GroupStatus } from '../../types/group'
import { GROUP_CATEGORY_LABELS } from '../../types/group'
import tableStyles from '../../components/admin/adminTable.module.css'
import styles from './AdminGroupsPage.module.css'

const PAGE_SIZE = 10

const SEARCH_FIELDS = [
  { value: 'ALL', label: '통합' },
  { value: 'NAME', label: '모임명' },
  { value: 'LEADER', label: '모임장' },
] as const

function StatusBadge({ status }: { status: GroupStatus }) {
  if (status === 'PENDING') {
    return <span className={styles.badgePending}>대기중</span>
  }
  if (status === 'ACTIVE') {
    return <span className="badge badge-success">활성</span>
  }
  return <span className={styles.badgeRejected}>거절됨</span>
}

export function AdminGroupsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const handleUnauthorized = useHandleUnauthorized()

  const [groups, setGroups] = useState<AdminGroupResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searchField, setSearchField] = useState('ALL')
  const debouncedKeyword = useDebouncedValue(keyword)

  const loadGroups = useCallback(
    async (targetPage: number, searchKeyword: string, field: string) => {
      try {
        setLoading(true)
        setError('')
        const response = await getAdminGroups(token, targetPage, PAGE_SIZE, searchKeyword, field)
        setGroups(response.content)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (err) {
        const message = err instanceof Error ? err.message : '모임 목록 조회 실패'
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
    loadGroups(0, debouncedKeyword, searchField)
  }, [debouncedKeyword, searchField, loadGroups])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadGroups(nextPage, debouncedKeyword, searchField)
  }

  return (
    <div className={styles.container}>
      <AdminPageHeader
        title="모임 관리"
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
            <div className={tableStyles.totalCount}>총 {totalElements.toLocaleString()}건</div>
            <div className={tableStyles.tableWrap} style={{ position: 'relative' }}>
              {loading && <LoadingSpinner overlay />}
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>모임명</th>
                    <th>지역</th>
                    <th>카테고리</th>
                    <th>개설자</th>
                    <th>상태</th>
                    <th>회원수</th>
                    <th>생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 ? (
                    <tr className={tableStyles.emptyRow}>
                      <td colSpan={8}>등록된 모임이 없습니다.</td>
                    </tr>
                  ) : (
                    groups.map((group) => (
                      <tr
                        key={group.id}
                        className={styles.groupRow}
                        onClick={() => navigate(`/app/admin/groups/${group.id}`)}
                      >
                        <td className={tableStyles.tableDate}>{group.id}</td>
                        <td>
                          <span className={tableStyles.tableUsername}>{group.name}</span>
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          {extractLastTwoRegionTokens(group.region) ?? '—'}
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          {GROUP_CATEGORY_LABELS[group.category]}
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          {group.leaderUsername}
                        </td>
                        <td>
                          <StatusBadge status={group.status} />
                        </td>
                        <td className={tableStyles.tableDate}>
                          {group.currentMemberCount} / {group.maxMemberCount}
                        </td>
                        <td className={tableStyles.tableDate}>
                          {formatDateTime(group.createdDate)}
                        </td>
                      </tr>
                    ))
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
