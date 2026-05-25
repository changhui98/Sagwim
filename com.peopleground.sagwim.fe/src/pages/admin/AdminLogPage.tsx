import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { getErrorLogs, getRegistrationLogs } from '../../api/logApi'
import type { StatusGroup } from '../../api/logApi'
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

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function todayStr(): string {
  return toDateString(new Date())
}

function nMonthsAgoStr(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return toDateString(d)
}

type QuickRange = 'today' | '1m' | '3m' | 'custom'

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

  // ─── 에러 로그 필터 상태 ───────────────────────────────────────────────────
  const [quickRange, setQuickRange] = useState<QuickRange>('today')
  const [fromDate, setFromDate] = useState<string>(todayStr())
  const [toDate, setToDate] = useState<string>(todayStr())
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('all')

  // 빠른 기간 버튼 클릭 시 날짜 input 자동 세팅
  const applyQuickRange = (range: QuickRange) => {
    setQuickRange(range)
    const today = todayStr()
    if (range === 'today') {
      setFromDate(today)
      setToDate(today)
    } else if (range === '1m') {
      setFromDate(nMonthsAgoStr(1))
      setToDate(today)
    } else if (range === '3m') {
      setFromDate(nMonthsAgoStr(3))
      setToDate(today)
    }
    // 'custom'은 input에서 직접 변경하므로 여기서 날짜는 건드리지 않는다
  }

  const handleFromDateChange = (val: string) => {
    setFromDate(val)
    setQuickRange('custom')
  }

  const handleToDateChange = (val: string) => {
    setToDate(val)
    setQuickRange('custom')
  }

  // ─── 데이터 로딩 ──────────────────────────────────────────────────────────

  const load = useCallback(
    async (currentPage: number, from = fromDate, to = toDate, sg = statusGroup) => {
      setLoading(true)
      try {
        if (tab === 'error') {
          const data = await getErrorLogs(token, currentPage, PAGE_SIZE, from, to, sg)
          setErrorLogs(data)
        } else if (tab === 'registration') {
          const data = await getRegistrationLogs(token, currentPage, PAGE_SIZE, from, to)
          setRegLogs(data)
        } else {
          const data = await getDeleteLogs(token, currentPage, DELETE_LOG_PAGE_SIZE, from, to)
          setDeleteLogs(data)
        }
      } catch (err) {
        handleUnauthorized(err)
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, tab, handleUnauthorized],
  )

  useEffect(() => {
    setPage(0)
    // 탭 전환 시 에러 탭은 현재 필터 그대로 재조회
    load(0, fromDate, toDate, statusGroup)
    // load 자체가 tab을 의존하므로 fromDate/toDate/statusGroup은 여기서 dep에 넣지 않음
    // (필터 변경은 조회 버튼으로 수동 트리거)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, load])

  useEffect(() => {
    if (autoRefresh) {
      pollRef.current = setInterval(() => load(page, fromDate, toDate, statusGroup), POLL_INTERVAL_MS)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [autoRefresh, load, page, fromDate, toDate, statusGroup])

  const handlePageChange = (next: number) => {
    setPage(next)
    load(next, fromDate, toDate, statusGroup)
  }

  // 조회 버튼 클릭 — 명시적 조회 트리거
  const handleSearch = () => {
    setPage(0)
    load(0, fromDate, toDate, statusGroup)
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
          <button type="button" className={pageStyles.btnRefresh} onClick={() => load(page, fromDate, toDate, statusGroup)}>
            새로고침
          </button>
        </div>
      </div>

      {/* ── 날짜 필터 (전 탭 공통, 상태코드는 에러 탭 전용) ── */}
      <div className={pageStyles.filterBar}>
        {/* 빠른 기간 */}
        <div className={pageStyles.filterGroup}>
          <span className={pageStyles.filterLabel}>기간</span>
          <div className={pageStyles.toggleGroup}>
            {(['today', '1m', '3m'] as const).map((range) => (
              <button
                key={range}
                type="button"
                className={quickRange === range ? pageStyles.toggleBtnActive : pageStyles.toggleBtn}
                onClick={() => applyQuickRange(range)}
              >
                {range === 'today' ? '오늘' : range === '1m' ? '1개월' : '3개월'}
              </button>
            ))}
          </div>
        </div>

        {/* 직접 날짜 입력 */}
        <div className={pageStyles.filterGroup}>
          <input
            type="date"
            className={pageStyles.dateInput}
            value={fromDate}
            max={toDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
          />
          <span className={pageStyles.dateSep}>~</span>
          <input
            type="date"
            className={pageStyles.dateInput}
            value={toDate}
            min={fromDate}
            max={todayStr()}
            onChange={(e) => handleToDateChange(e.target.value)}
          />
        </div>

        {/* 상태코드 필터 — 에러 탭 전용 */}
        {tab === 'error' && (
          <div className={pageStyles.filterGroup}>
            <span className={pageStyles.filterLabel}>상태코드</span>
            <div className={pageStyles.toggleGroup}>
              {(['all', '4xx', '5xx'] as const).map((sg) => (
                <button
                  key={sg}
                  type="button"
                  className={statusGroup === sg ? pageStyles.toggleBtnActive : pageStyles.toggleBtn}
                  onClick={() => setStatusGroup(sg)}
                >
                  {sg === 'all' ? '전체' : sg}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 조회 버튼 */}
        <button
          type="button"
          className={pageStyles.btnSearch}
          onClick={handleSearch}
        >
          조회
        </button>
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
