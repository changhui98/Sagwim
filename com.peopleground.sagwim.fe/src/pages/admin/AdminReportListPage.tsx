import { useCallback, useEffect, useState } from 'react'
import { getAdminReports } from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/common/Skeleton'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Pagination } from '../../components/common/Pagination'
import { formatDateTime } from '../../utils/dateUtils'
import type { AdminReportEntry, ReportTargetType } from '../../types/report'
import type { PageResponse } from '../../types/user'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminReportListPage.module.css'

const PAGE_SIZE = 20

export function AdminReportListPage() {
  const { token } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [reports, setReports] = useState<AdminReportEntry[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword)

  const loadReports = useCallback(
    async (targetPage: number, searchKeyword: string) => {
      try {
        setLoading(true)
        setError('')
        const response: PageResponse<AdminReportEntry> = await getAdminReports(token, targetPage, PAGE_SIZE, searchKeyword)
        setReports(response.content)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (err) {
        const message = err instanceof Error ? err.message : '신고 목록 조회 실패'
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
    loadReports(0, debouncedKeyword)
  }, [debouncedKeyword, loadReports])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadReports(nextPage, debouncedKeyword)
  }

  return (
    <div className={pageStyles.container}>
      <AdminPageHeader
        title="신고 내역"
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="신고자 닉네임·신고 사유 검색"
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
                    <th>종류</th>
                    <th>신고된 내용</th>
                    <th>신고한 사람</th>
                    <th>신고 사유</th>
                    <th>신고 날짜</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr className={tableStyles.emptyRow}>
                      <td colSpan={5}>신고 내역이 없습니다.</td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <span className={targetTypeBadgeClass(report.targetType)}>
                            {targetTypeLabel(report.targetType)}
                          </span>
                        </td>
                        <td className={pageStyles.cellContent} title={report.targetContent}>
                          {report.targetContent}
                        </td>
                        <td className={pageStyles.cellMono}>
                          {report.reporterNickname}
                        </td>
                        <td className={pageStyles.cellReason} title={report.reason}>
                          {report.reason}
                        </td>
                        <td className={pageStyles.cellTime}>
                          {formatDateTime(report.reportedAt)}
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

function targetTypeLabel(type: ReportTargetType): string {
  switch (type) {
    case 'POST': return '게시글'
    case 'COMMENT': return '댓글'
    case 'MESSAGE': return '메시지'
    default: return type
  }
}

function targetTypeBadgeClass(type: ReportTargetType): string {
  switch (type) {
    case 'POST': return pageStyles.badgePost
    case 'COMMENT': return pageStyles.badgeComment
    case 'MESSAGE': return pageStyles.badgeMessage
    default: return pageStyles.badgePost
  }
}

