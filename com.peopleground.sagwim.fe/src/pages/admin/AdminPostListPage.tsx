import { useCallback, useEffect, useState } from 'react'
import confirmDialogStyles from '../../components/common/ConfirmDialog.module.css'
import {
  deleteAdminContent,
  getAdminContents,
  restoreAdminContent,
} from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Skeleton } from '../../components/common/Skeleton'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { SuccessDialog } from '../../components/common/SuccessDialog'
import { Pagination } from '../../components/common/Pagination'
import { formatDateTime } from '../../utils/dateUtils'
import type { AdminContentResponse } from '../../types/post'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminPostListPage.module.css'

const PAGE_SIZE = 10

const SEARCH_FIELDS = [
  { value: 'ALL', label: '통합' },
  { value: 'BODY', label: '내용' },
  { value: 'AUTHOR', label: '작성자' },
] as const

type ConfirmAction = 'delete' | 'restore'

interface ConfirmState {
  content: AdminContentResponse
  action: ConfirmAction
}

export function AdminPostListPage() {
  const { token } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [contents, setContents] = useState<AdminContentResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searchField, setSearchField] = useState('ALL')
  const debouncedKeyword = useDebouncedValue(keyword)

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [successAction, setSuccessAction] = useState<ConfirmAction | null>(null)
  const [deleteReason, setDeleteReason] = useState('')

  const loadContents = useCallback(
    async (targetPage: number, searchKeyword: string, field: string) => {
      try {
        setLoading(true)
        setError('')
        const response = await getAdminContents(token, targetPage, PAGE_SIZE, searchKeyword, field)
        const sortedContents = [...response.content].sort((a, b) => {
          const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0
          const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0
          return bTime - aTime
        })
        setContents(sortedContents)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (err) {
        const message = err instanceof Error ? err.message : '게시글 목록 조회 실패'
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
    loadContents(0, debouncedKeyword, searchField)
  }, [debouncedKeyword, searchField, loadContents])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadContents(nextPage, debouncedKeyword, searchField)
  }

  const handleConfirm = async () => {
    if (!confirmState) return
    const { action } = confirmState
    try {
      setActionLoading(true)
      if (action === 'delete') {
        await deleteAdminContent(token, confirmState.content.id, deleteReason)
      } else {
        await restoreAdminContent(token, confirmState.content.id)
      }
      setConfirmState(null)
      setDeleteReason('')
      setSuccessAction(action)
      loadContents(page, debouncedKeyword, searchField)
    } catch (err) {
      const label = action === 'delete' ? '삭제' : '복구'
      const message = err instanceof Error ? err.message : `게시글 ${label} 실패`
      setError(message)
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const isDeleted = (content: AdminContentResponse): boolean => content.deletedDate !== null

  return (
    <div className={pageStyles.container}>
      <AdminPageHeader
        title="게시글 관리"
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
                    <th>내용</th>
                    <th>작성자</th>
                    <th>작성일</th>
                    <th>수정일</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.length === 0 ? (
                    <tr className={tableStyles.emptyRow}>
                      <td colSpan={7}>등록된 게시글이 없습니다.</td>
                    </tr>
                  ) : (
                    contents.map((content) => (
                      <tr key={content.id}>
                        <td className={tableStyles.tableDate}>{content.id}</td>
                        <td>
                          <span
                            className={`${tableStyles.tableSecondary} ${tableStyles.truncateCell}`}
                            style={{ maxWidth: 360 }}
                            title={content.body}
                          >
                            {content.body}
                          </span>
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          @{content.createdBy}
                        </td>
                        <td className={tableStyles.tableDate}>
                          {formatDateTime(content.createdDate)}
                        </td>
                        <td className={tableStyles.tableDate}>
                          {formatDateTime(content.lastModifiedDate)}
                        </td>
                        <td>
                          {isDeleted(content) ? (
                            <span className={`badge ${tableStyles.badgeDeleted}`}>
                              삭제됨
                            </span>
                          ) : (
                            <span className="badge badge-success">활성</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                            {isDeleted(content) ? (
                              <button
                                type="button"
                                className={tableStyles.refreshButton}
                                onClick={() =>
                                  setConfirmState({ content, action: 'restore' })
                                }
                                disabled={actionLoading}
                              >
                                복구
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={tableStyles.deleteButton}
                                onClick={() =>
                                  setConfirmState({ content, action: 'delete' })
                                }
                                disabled={actionLoading}
                              >
                                삭제
                              </button>
                            )}
                          </div>
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

      <ConfirmDialog
        isOpen={confirmState !== null}
        title={confirmState?.action === 'delete' ? '게시글 삭제' : '게시글 복구'}
        message={
          confirmState
            ? confirmState.action === 'delete'
              ? '선택한 게시글을 삭제하시겠습니까?'
              : '선택한 게시글을 복구하시겠습니까?'
            : ''
        }
        confirmLabel={confirmState?.action === 'delete' ? '삭제' : '복구'}
        confirmVariant={confirmState?.action === 'delete' ? 'danger' : 'primary'}
        isLoading={actionLoading}
        confirmDisabled={confirmState?.action === 'delete' && deleteReason.trim() === ''}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmState(null)
          setDeleteReason('')
        }}
      >
        {confirmState?.action === 'delete' && (
          <div className={confirmDialogStyles.reasonField}>
            <label htmlFor="post-delete-reason" className={confirmDialogStyles.reasonLabel}>
              삭제 사유 <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="post-delete-reason"
              className={confirmDialogStyles.reasonTextarea}
              placeholder="삭제 사유를 입력해주세요."
              maxLength={500}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
        )}
      </ConfirmDialog>

      <SuccessDialog
        isOpen={successAction !== null}
        title={
          successAction === 'delete'
            ? '게시글이 삭제되었습니다'
            : '게시글이 복구되었습니다'
        }
        message={
          successAction === 'delete'
            ? '선택한 게시글을 삭제 처리했어요.'
            : '선택한 게시글을 복구했어요.'
        }
        onClose={() => setSuccessAction(null)}
      />
    </div>
  )
}
