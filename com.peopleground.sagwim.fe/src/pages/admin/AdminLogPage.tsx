import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { getErrorLogs, getRegistrationLogs } from '../../api/logApi'
import { getDeleteLogs, restoreDeleteLog } from '../../api/adminApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { Skeleton } from '../../components/common/Skeleton'
import { formatDateTime } from '../../utils/dateUtils'
import type { ErrorLogEntry, LogPageResponse, RegistrationLogEntry } from '../../types/log'
import type { DeleteLogEntry } from '../../types/deleteLog'
import type { PageResponse } from '../../types/user'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminLogPage.module.css'

type Tab = 'error' | 'registration' | 'delete'

const PAGE_SIZE = 50
const DELETE_LOG_PAGE_SIZE = 20
const POLL_INTERVAL_MS = 10_000

function statusBadgeClass(status: number): string {
  if (status >= 500) return pageStyles.badgeRed
  if (status >= 400) return pageStyles.badgeYellow
  return pageStyles.badgeGreen
}

export function AdminLogPage() {
  const { token } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [tab, setTab] = useState<Tab>('error')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorLogs, setErrorLogs] = useState<LogPageResponse<ErrorLogEntry> | null>(null)
  const [regLogs, setRegLogs] = useState<LogPageResponse<RegistrationLogEntry> | null>(null)
  const [deleteLogs, setDeleteLogs] = useState<PageResponse<DeleteLogEntry> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(
    async (currentPage: number) => {
      setLoading(true)
      try {
        if (tab === 'error') {
          const data = await getErrorLogs(token, currentPage, PAGE_SIZE)
          setErrorLogs(data)
        } else if (tab === 'registration') {
          const data = await getRegistrationLogs(token, currentPage, PAGE_SIZE)
          setRegLogs(data)
        } else {
          const data = await getDeleteLogs(token, currentPage, DELETE_LOG_PAGE_SIZE)
          setDeleteLogs(data)
        }
      } catch (err) {
        handleUnauthorized(err)
      } finally {
        setLoading(false)
      }
    },
    [token, tab, handleUnauthorized],
  )

  useEffect(() => {
    setPage(0)
    load(0)
  }, [tab, load])

  useEffect(() => {
    if (autoRefresh) {
      pollRef.current = setInterval(() => load(page), POLL_INTERVAL_MS)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [autoRefresh, load, page])

  const handlePageChange = (next: number) => {
    setPage(next)
    load(next)
  }

  const handleRestore = useCallback(
    async (logId: number) => {
      try {
        const updated = await restoreDeleteLog(token, logId)
        setDeleteLogs((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            content: prev.content.map((entry) =>
              entry.id === updated.id ? updated : entry,
            ),
          }
        })
      } catch (err) {
        handleUnauthorized(err)
        if (err instanceof ApiError) {
          alert(`복원 실패: ${err.message}`)
        }
      }
    },
    [token, handleUnauthorized],
  )

  const currentData = tab === 'error' ? errorLogs : tab === 'registration' ? regLogs : deleteLogs

  return (
    <div className={pageStyles.container}>
      <div className={pageStyles.header}>
        <div className={tableStyles.tabs}>
          <button
            className={tab === 'error' ? tableStyles.tabActive : tableStyles.tab}
            onClick={() => setTab('error')}
            type="button"
          >
            에러 로그
          </button>
          <button
            className={tab === 'registration' ? tableStyles.tabActive : tableStyles.tab}
            onClick={() => setTab('registration')}
            type="button"
          >
            회원가입 로그
          </button>
          <button
            className={tab === 'delete' ? tableStyles.tabActive : tableStyles.tab}
            onClick={() => setTab('delete')}
            type="button"
          >
            삭제 로그
          </button>
        </div>

        <div className={pageStyles.actions}>
          {tab !== 'delete' && (
            <button
              type="button"
              className={autoRefresh ? pageStyles.btnLiveOn : pageStyles.btnLive}
              onClick={() => setAutoRefresh((v) => !v)}
            >
              {autoRefresh ? '● 자동 새로고침 중' : '자동 새로고침'}
            </button>
          )}
          <button type="button" className={pageStyles.btnRefresh} onClick={() => load(page)}>
            새로고침
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton height="400px" />
      ) : tab === 'error' ? (
        <ErrorLogTable logs={errorLogs} />
      ) : tab === 'registration' ? (
        <RegistrationLogTable logs={regLogs} />
      ) : (
        <DeleteLogTable logs={deleteLogs} onRestore={handleRestore} />
      )}

      {currentData && currentData.totalPages > 1 && (
        <div className={pageStyles.pagination}>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => handlePageChange(page - 1)}
            className={pageStyles.pageBtn}
          >
            이전
          </button>
          <span className={pageStyles.pageInfo}>
            {page + 1} / {currentData.totalPages}
          </span>
          <button
            type="button"
            disabled={!currentData.hasNext}
            onClick={() => handlePageChange(page + 1)}
            className={pageStyles.pageBtn}
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}

/** 상세 정보가 하나라도 존재하면 true */
function hasDetail(entry: ErrorLogEntry): boolean {
  return !!(
    entry.errorMessage ||
    entry.requestBody ||
    entry.queryParams ||
    entry.stacktrace
  )
}

function ErrorLogTable({ logs }: { logs: LogPageResponse<ErrorLogEntry> | null }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (!logs) return null
  if (logs.content.length === 0) {
    return <p className={pageStyles.empty}>에러 로그가 없습니다.</p>
  }

  const handleRowClick = (i: number, entry: ErrorLogEntry) => {
    if (!hasDetail(entry)) return
    setExpandedIndex(expandedIndex === i ? null : i)
  }

  return (
    <div className={tableStyles.tableWrap}>
      <div className={tableStyles.totalCount}>총 {logs.totalElements.toLocaleString()}건</div>
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th>시각</th>
            <th>메서드</th>
            <th>경로</th>
            <th>상태</th>
            <th>IP</th>
            <th>사용자</th>
          </tr>
        </thead>
        <tbody>
          {logs.content.map((entry, i) => (
            <Fragment key={i}>
              <tr
                className={hasDetail(entry) ? pageStyles.rowClickable : undefined}
                onClick={() => handleRowClick(i, entry)}
              >
                <td className={pageStyles.cellTime}>{formatDateTime(entry.timestamp)}</td>
                <td>
                  <span className={pageStyles.methodBadge}>{entry.method}</span>
                </td>
                <td className={pageStyles.cellPath} title={entry.path}>
                  {entry.path}
                </td>
                <td>
                  <span className={statusBadgeClass(entry.status)}>{entry.status}</span>
                  {hasDetail(entry) && (
                    <span className={pageStyles.expandIcon}>
                      {expandedIndex === i ? '▼' : '▶'}
                    </span>
                  )}
                </td>
                <td className={pageStyles.cellMono}>{entry.ip}</td>
                <td className={pageStyles.cellMono}>{entry.username ?? entry.ip}</td>
              </tr>
              {hasDetail(entry) && expandedIndex === i && (
                <tr className={pageStyles.stacktraceRow}>
                  <td colSpan={6}>
                    <ErrorLogDetail entry={entry} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ErrorLogDetail({ entry }: { entry: ErrorLogEntry }) {
  return (
    <div className={pageStyles.detailPanel}>
      {entry.errorMessage && (
        <div className={pageStyles.detailSection}>
          <span className={pageStyles.detailLabel}>에러 메시지</span>
          <pre className={pageStyles.detailMono}>{entry.errorMessage}</pre>
        </div>
      )}
      {entry.queryParams && (
        <div className={pageStyles.detailSection}>
          <span className={pageStyles.detailLabel}>쿼리 파라미터</span>
          <pre className={pageStyles.detailMono}>{entry.queryParams}</pre>
        </div>
      )}
      {entry.requestBody && (
        <div className={pageStyles.detailSection}>
          <span className={pageStyles.detailLabel}>요청 바디</span>
          <pre className={pageStyles.detailMono}>{prettyJson(entry.requestBody)}</pre>
        </div>
      )}
      {entry.stacktrace && (
        <div className={pageStyles.detailSection}>
          <span className={pageStyles.detailLabel}>스택트레이스</span>
          <pre className={pageStyles.stacktracePre}>{entry.stacktrace}</pre>
        </div>
      )}
    </div>
  )
}

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function RegistrationLogTable({
  logs,
}: {
  logs: LogPageResponse<RegistrationLogEntry> | null
}) {
  if (!logs) return null
  if (logs.content.length === 0) {
    return <p className={pageStyles.empty}>회원가입 로그가 없습니다.</p>
  }
  return (
    <div className={tableStyles.tableWrap}>
      <div className={tableStyles.totalCount}>총 {logs.totalElements.toLocaleString()}건</div>
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th>가입 시각</th>
            <th>사용자명</th>
            <th>이메일</th>
            <th>가입 방식</th>
          </tr>
        </thead>
        <tbody>
          {logs.content.map((entry, i) => (
            <tr key={i}>
              <td className={pageStyles.cellTime}>{formatDateTime(entry.timestamp)}</td>
              <td className={pageStyles.cellMono}>{entry.username}</td>
              <td>{entry.email}</td>
              <td>
                <span className={providerBadgeClass(entry.provider)}>{entry.provider}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function providerBadgeClass(provider: string): string {
  if (provider === 'KAKAO') return tableStyles.badgeKakao
  if (provider === 'GOOGLE') return tableStyles.badgeGoogle
  return tableStyles.badgeLocal
}

function DeleteLogTable({
  logs,
  onRestore,
}: {
  logs: PageResponse<DeleteLogEntry> | null
  onRestore: (logId: number) => Promise<void>
}) {
  const [restoringId, setRestoringId] = useState<number | null>(null)

  if (!logs) return null
  if (logs.content.length === 0) {
    return <p className={pageStyles.empty}>삭제 로그가 없습니다.</p>
  }

  const handleRestore = async (logId: number) => {
    setRestoringId(logId)
    try {
      await onRestore(logId)
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className={tableStyles.tableWrap}>
      <div className={tableStyles.totalCount}>총 {logs.totalElements.toLocaleString()}건</div>
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th>삭제자</th>
            <th>대상 유형</th>
            <th>대상</th>
            <th>삭제 사유</th>
            <th>삭제 일시</th>
            <th>복원 여부</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {logs.content.map((entry) => (
            <tr key={entry.id}>
              <td className={pageStyles.cellMono}>{entry.deletedBy}</td>
              <td>
                <span className={targetTypeBadgeClass(entry.targetType)}>
                  {targetTypeLabel(entry.targetType)}
                </span>
              </td>
              <td className={pageStyles.cellSummary} title={entry.targetSummary}>
                {entry.targetSummary}
              </td>
              <td className={pageStyles.cellReason} title={entry.reason ?? undefined}>
                {entry.reason ?? '-'}
              </td>
              <td className={pageStyles.cellTime}>{formatDateTime(entry.deletedAt)}</td>
              <td>
                {entry.restored ? (
                  <span className={pageStyles.badgeRestored}>복원됨</span>
                ) : (
                  <span className={pageStyles.badgePending}>미복원</span>
                )}
                {entry.restored && entry.restoredBy && (
                  <span className={pageStyles.restoredMeta}>
                    {' '}by {entry.restoredBy}
                  </span>
                )}
              </td>
              <td>
                {entry.targetType !== 'IMAGE' && !entry.restored ? (
                  <button
                    type="button"
                    className={pageStyles.btnRestore}
                    disabled={restoringId === entry.id}
                    onClick={() => handleRestore(entry.id)}
                  >
                    {restoringId === entry.id ? '복원 중...' : '복원'}
                  </button>
                ) : (
                  <span className={pageStyles.noAction}>
                    {entry.targetType === 'IMAGE' ? '불가' : '-'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function targetTypeLabel(type: string): string {
  switch (type) {
    case 'USER': return '사용자'
    case 'GROUP': return '모임'
    case 'POST': return '게시글'
    case 'IMAGE': return '이미지'
    default: return type
  }
}

function targetTypeBadgeClass(type: string): string {
  switch (type) {
    case 'USER': return pageStyles.badgeUser
    case 'GROUP': return pageStyles.badgeGroup
    case 'POST': return pageStyles.badgePost
    case 'IMAGE': return pageStyles.badgeImage
    default: return pageStyles.badgePost
  }
}
