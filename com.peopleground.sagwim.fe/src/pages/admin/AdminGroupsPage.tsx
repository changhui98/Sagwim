import { useCallback, useEffect, useState } from 'react'
import confirmDialogStyles from '../../components/common/ConfirmDialog.module.css'
import { useNavigate } from 'react-router-dom'
import {
  approveAdminGroup,
  deleteAdminGroup,
  getAdminGroups,
  rejectAdminGroup,
} from '../../api/adminApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Skeleton } from '../../components/common/Skeleton'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { SuccessDialog } from '../../components/common/SuccessDialog'
import { formatDateTime } from '../../utils/dateUtils'
import type { AdminGroupResponse, GroupStatus } from '../../types/group'
import { GROUP_CATEGORY_LABELS } from '../../types/group'
import tableStyles from '../../components/admin/adminTable.module.css'
import styles from './AdminGroupsPage.module.css'

const PAGE_SIZE = 10
const MAX_VISIBLE_PAGES = 5

type ConfirmAction = 'approve' | 'reject' | 'delete'

interface ConfirmState {
  group: AdminGroupResponse
  action: ConfirmAction
}

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
  const navigate = useNavigate()
  const { token, logout } = useAuth()

  const [groups, setGroups] = useState<AdminGroupResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [successAction, setSuccessAction] = useState<ConfirmAction | null>(null)
  const [deleteReason, setDeleteReason] = useState('')

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )

  const loadGroups = useCallback(
    async (targetPage: number) => {
      try {
        setLoading(true)
        setError('')
        const response = await getAdminGroups(token, targetPage, PAGE_SIZE)
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
    loadGroups(0)
  }, [loadGroups])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadGroups(nextPage)
  }

  const handleConfirm = async () => {
    if (!confirmState) return
    const { action, group } = confirmState
    try {
      setActionLoading(true)
      if (action === 'approve') {
        await approveAdminGroup(token, group.id)
      } else if (action === 'reject') {
        await rejectAdminGroup(token, group.id)
      } else if (action === 'delete') {
        await deleteAdminGroup(token, group.id, deleteReason)
      }
      setConfirmState(null)
      setDeleteReason('')
      setSuccessAction(action)
      loadGroups(page)
    } catch (err) {
      const label = action === 'approve' ? '승인' : action === 'reject' ? '거절' : '삭제'
      const message = err instanceof Error ? err.message : `모임 ${label} 실패`
      setError(message)
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const getPageNumbers = (): number[] => {
    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i)
    }
    const half = Math.floor(MAX_VISIBLE_PAGES / 2)
    let start = Math.max(0, page - half)
    const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES)
    if (end - start < MAX_VISIBLE_PAGES) {
      start = Math.max(0, end - MAX_VISIBLE_PAGES)
    }
    return Array.from({ length: end - start }, (_, i) => start + i)
  }

  return (
    <div className={styles.container}>
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
                    <th>설명</th>
                    <th>카테고리</th>
                    <th>개설자</th>
                    <th>상태</th>
                    <th>회원수</th>
                    <th>생성일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 ? (
                    <tr className={tableStyles.emptyRow}>
                      <td colSpan={9}>등록된 모임이 없습니다.</td>
                    </tr>
                  ) : (
                    groups.map((group) => (
                      <tr key={group.id}>
                        <td className={tableStyles.tableDate}>{group.id}</td>
                        <td>
                          <span className={tableStyles.tableUsername}>{group.name}</span>
                        </td>
                        <td className={styles.groupDescCell}>
                          {group.description ?? '—'}
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          {GROUP_CATEGORY_LABELS[group.category]}
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          @{group.leaderUsername}
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
                        <td>
                          <div className={styles.actionButtons}>
                            {group.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  className={tableStyles.refreshButton}
                                  onClick={() => setConfirmState({ group, action: 'approve' })}
                                  disabled={actionLoading}
                                >
                                  승인
                                </button>
                                <button
                                  type="button"
                                  className={tableStyles.deleteButton}
                                  onClick={() => setConfirmState({ group, action: 'reject' })}
                                  disabled={actionLoading}
                                >
                                  거절
                                </button>
                              </>
                            )}
                            {group.status === 'ACTIVE' && (
                              <button
                                type="button"
                                className={tableStyles.deleteButton}
                                onClick={() => setConfirmState({ group, action: 'delete' })}
                                disabled={actionLoading}
                              >
                                삭제
                              </button>
                            )}
                            {group.status === 'REJECTED' && (
                              <button
                                type="button"
                                className={tableStyles.refreshButton}
                                onClick={() => setConfirmState({ group, action: 'approve' })}
                                disabled={actionLoading}
                              >
                                승인
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

            {totalPages > 1 && (
              <div className={tableStyles.paginationBar}>
                <button
                  type="button"
                  className={tableStyles.pageButton}
                  onClick={() => handlePageChange(page - 1)}
                  disabled={loading || page === 0}
                >
                  이전
                </button>
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={
                      pageNum === page
                        ? tableStyles.pageButtonActive
                        : tableStyles.pageButton
                    }
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                  >
                    {pageNum + 1}
                  </button>
                ))}
                <button
                  type="button"
                  className={tableStyles.pageButton}
                  onClick={() => handlePageChange(page + 1)}
                  disabled={loading || page >= totalPages - 1}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmState !== null}
        title={
          confirmState?.action === 'approve'
            ? '모임 승인'
            : confirmState?.action === 'reject'
              ? '모임 거절'
              : '모임 삭제'
        }
        message={
          confirmState
            ? confirmState.action === 'approve'
              ? `"${confirmState.group.name}" 모임을 승인하시겠습니까?`
              : confirmState.action === 'reject'
                ? `"${confirmState.group.name}" 모임을 거절하시겠습니까?`
                : `"${confirmState.group.name}" 모임을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
            : ''
        }
        confirmLabel={
          confirmState?.action === 'approve'
            ? '승인'
            : confirmState?.action === 'reject'
              ? '거절'
              : '삭제'
        }
        confirmVariant={confirmState?.action === 'approve' ? 'primary' : 'danger'}
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
            <label htmlFor="group-delete-reason" className={confirmDialogStyles.reasonLabel}>
              삭제 사유 <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="group-delete-reason"
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
          successAction === 'approve'
            ? '모임이 승인되었습니다'
            : successAction === 'reject'
              ? '모임이 거절되었습니다'
              : '모임이 삭제되었습니다'
        }
        message={
          successAction === 'approve'
            ? '모임이 활성화되어 사용자에게 노출됩니다.'
            : successAction === 'reject'
              ? '모임 개설 요청을 거절했습니다.'
              : '모임이 삭제되었습니다.'
        }
        onClose={() => setSuccessAction(null)}
      />
    </div>
  )
}
