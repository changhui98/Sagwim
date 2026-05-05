import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorLogs, getRegistrationLogs } from '../../api/logApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { Skeleton } from '../../components/common/Skeleton'
import { formatDateTime } from '../../utils/dateUtils'
import type { ErrorLogEntry, LogPageResponse, RegistrationLogEntry } from '../../types/log'
import styles from './AdminLogPage.module.css'

type Tab = 'error' | 'registration'

const PAGE_SIZE = 50
const POLL_INTERVAL_MS = 10_000

function statusBadgeClass(status: number): string {
  if (status >= 500) return styles.badgeRed
  if (status >= 400) return styles.badgeYellow
  return styles.badgeGreen
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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={tab === 'error' ? styles.tabActive : styles.tab}
            onClick={() => setTab('error')}
            type="button"
          >
            에러 로그
          </button>
          <button
            className={tab === 'registration' ? styles.tabActive : styles.tab}
            onClick={() => setTab('registration')}
            type="button"
          >
            회원가입 로그
          </button>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={autoRefresh ? styles.btnLiveOn : styles.btnLive}
            onClick={() => setAutoRefresh((v) => !v)}
          >
            {autoRefresh ? '● 자동 새로고침 중' : '자동 새로고침'}
          </button>
          <button type="button" className={styles.btnRefresh} onClick={() => load(page)}>
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
        <div className={styles.pagination}>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => handlePageChange(page - 1)}
            className={styles.pageBtn}
          >
            이전
          </button>
          <span className={styles.pageInfo}>
            {page + 1} / {currentData.totalPages}
          </span>
          <button
            type="button"
            disabled={!currentData.hasNext}
            onClick={() => handlePageChange(page + 1)}
            className={styles.pageBtn}
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}

function ErrorLogTable({ logs }: { logs: LogPageResponse<ErrorLogEntry> | null }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (!logs) return null
  if (logs.content.length === 0) {
    return <p className={styles.empty}>에러 로그가 없습니다.</p>
  }

  const handleRowClick = (i: number, entry: ErrorLogEntry) => {
    if (entry.status < 500) return
    setExpandedIndex(expandedIndex === i ? null : i)
  }

  return (
    <div className={styles.tableWrap}>
      <div className={styles.totalCount}>총 {logs.totalElements.toLocaleString()}건</div>
      <table className={styles.table}>
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
                className={entry.status >= 500 ? styles.rowClickable : undefined}
                onClick={() => handleRowClick(i, entry)}
              >
                <td className={styles.cellTime}>{formatDateTime(entry.timestamp)}</td>
                <td>
                  <span className={styles.methodBadge}>{entry.method}</span>
                </td>
                <td className={styles.cellPath} title={entry.path}>
                  {entry.path}
                </td>
                <td>
                  <span className={statusBadgeClass(entry.status)}>{entry.status}</span>
                  {entry.status >= 500 && (
                    <span className={styles.expandIcon}>
                      {expandedIndex === i ? '▼' : '▶'}
                    </span>
                  )}
                </td>
                <td className={styles.cellMono}>{entry.ip}</td>
                <td className={styles.cellMono}>{entry.userId}</td>
              </tr>
              {entry.status >= 500 && expandedIndex === i && (
                <tr className={styles.stacktraceRow}>
                  <td colSpan={6}>
                    {entry.stacktrace ? (
                      <pre className={styles.stacktracePre}>{entry.stacktrace}</pre>
                    ) : (
                      <p className={styles.noStacktrace}>(상세 정보 없음 — 이전 로그)</p>
                    )}
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

function RegistrationLogTable({
  logs,
}: {
  logs: LogPageResponse<RegistrationLogEntry> | null
}) {
  if (!logs) return null
  if (logs.content.length === 0) {
    return <p className={styles.empty}>회원가입 로그가 없습니다.</p>
  }
  return (
    <div className={styles.tableWrap}>
      <div className={styles.totalCount}>총 {logs.totalElements.toLocaleString()}건</div>
      <table className={styles.table}>
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
              <td className={styles.cellTime}>{formatDateTime(entry.timestamp)}</td>
              <td className={styles.cellMono}>{entry.username}</td>
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
  if (provider === 'KAKAO') return styles.badgeKakao
  if (provider === 'GOOGLE') return styles.badgeGoogle
  return styles.badgeLocal
}
