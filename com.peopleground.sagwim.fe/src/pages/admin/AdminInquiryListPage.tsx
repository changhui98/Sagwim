import { useCallback, useEffect, useState } from 'react'
import { getAdminInquiries } from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { Skeleton } from '../../components/common/Skeleton'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Pagination } from '../../components/common/Pagination'
import { formatDateTime } from '../../utils/dateUtils'
import type { AdminInquiryEntry, InquirySource } from '../../types/inquiry'
import type { PageResponse } from '../../types/user'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminInquiryListPage.module.css'

const PAGE_SIZE = 20

export function AdminInquiryListPage() {
  const { token } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [inquiries, setInquiries] = useState<AdminInquiryEntry[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')

  const loadInquiries = useCallback(
    async (targetPage: number) => {
      try {
        setLoading(true)
        setError('')
        const response: PageResponse<AdminInquiryEntry> = await getAdminInquiries(token, targetPage, PAGE_SIZE)
        setInquiries(response.content)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (err) {
        const message = err instanceof Error ? err.message : '문의 목록 조회 실패'
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
    loadInquiries(0)
  }, [loadInquiries])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadInquiries(nextPage)
  }

  return (
    <div className={pageStyles.container}>
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
                    <th>문의 경로</th>
                    <th>작성자</th>
                    <th>내용</th>
                    <th>작성일</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.length === 0 ? (
                    <tr className={tableStyles.emptyRow}>
                      <td colSpan={4}>문의 내역이 없습니다.</td>
                    </tr>
                  ) : (
                    inquiries.map((inquiry) => (
                      <tr key={inquiry.id}>
                        <td>
                          <span className={sourceBadgeClass(inquiry.source)}>
                            {sourceLabel(inquiry.source)}
                          </span>
                        </td>
                        <td className={pageStyles.cellAuthor}>
                          {inquiry.authorNickname ?? (
                            <span className={pageStyles.cellAuthorMuted}>알 수 없음</span>
                          )}
                        </td>
                        <td className={pageStyles.cellContent} title={inquiry.content}>
                          {inquiry.content || <span className={pageStyles.cellAuthorMuted}>(내용 없음)</span>}
                        </td>
                        <td className={pageStyles.cellTime}>
                          {formatDateTime(inquiry.createdDate)}
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

function sourceLabel(source: InquirySource): string {
  switch (source) {
    case 'WITHDRAWAL': return '회원 탈퇴'
    case 'INQUIRY': return '서비스 문의'
    default: return source
  }
}

function sourceBadgeClass(source: InquirySource): string {
  switch (source) {
    case 'WITHDRAWAL': return pageStyles.badgeWithdrawal
    case 'INQUIRY': return pageStyles.badgeInquiry
    default: return pageStyles.badgeInquiry
  }
}
