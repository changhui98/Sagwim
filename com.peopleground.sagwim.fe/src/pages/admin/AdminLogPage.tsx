import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorLogs, getRegistrationLogs } from '../../api/logApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { Skeleton } from '../../components/common/Skeleton'
import { formatDateTime } from '../../utils/dateUtils'
import type { ErrorLogEntry, LogPageResponse, RegistrationLogEntry } from '../../types/log'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminLogPage.module.css'

type Tab = 'error' | 'registration'

const PAGE_SIZE = 50
const POLL_INTERVAL_MS = 10_000

function statusBadgeClass(status: number): string {
  if (status >= 500) return pageStyles.badgeRed
  if (status >= 400) return pageStyles.badgeYellow
  return pageStyles.badgeGreen
}

export function AdminLogPage() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()

  const [tab, setTab] = useState<Tab>('error')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorLogs, setErrorLogs] = useState<LogPageResponse<ErrorLogEntry> | null>(null)
  const [regLogs, setRegLogs] = useState<LogPageResponse<RegistrationLogEntry> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )

  const load = useCallback(
    async (currentPage: number) => {
      setLoading(true)
      try {
        if (tab === 'error') {
          const data = await getErrorLogs(token, currentPage, PAGE_SIZE)
          setErrorLogs(data)
        } else {
          const data = await getRegistrationLogs(token, currentPage, PAGE_SIZE)
          setRegLogs(data)
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

  const currentData = tab === 'error' ? errorLogs : regLogs

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
        </div>

        <div className={pageStyles.actions}>
          <button
            type="button"
            className={autoRefresh ? pageStyles.btnLiveOn : pageStyles.btnLive}
            onClick={() => setAutoRefresh((v) => !v)}
          >
            {autoRefresh ? '● 자동 새로고침 중' : '자동 새로고침'}
          </button>
          <button type="button" className={pageStyles.btnRefresh} onClick={() => load(page)}>
            새로고침
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton height="400px" />
      ) : tab === 'error' ? (
        <ErrorLogTable logs={errorLogs} />
      ) : (
        <RegistrationLogTable logs={regLogs} />
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
