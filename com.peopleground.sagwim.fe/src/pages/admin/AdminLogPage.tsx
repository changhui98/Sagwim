import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import {
  getErrorLogs,
  getErrorLogSummary,
  getRegistrationLogs,
  getRegistrationLogSummary,
} from '../../api/logApi'
import type { StatusGroup } from '../../api/logApi'
import { getDeleteLogs, getDeleteLogSummary, restoreDeleteLog } from '../../api/adminApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { Skeleton } from '../../components/common/Skeleton'
import { Pagination } from '../../components/common/Pagination'
import { MiniDatePicker } from '../../components/admin/MiniDatePicker'
import { formatDateTime } from '../../utils/dateUtils'
import type {
  ErrorLogEntry,
  ErrorLogSummary,
  LogPageResponse,
  RegistrationLogEntry,
  RegistrationLogSummary,
} from '../../types/log'
import type { DeleteLogEntry, DeleteLogSummary } from '../../types/deleteLog'
import type { PageResponse } from '../../types/user'
import s from './AdminLogPage.module.css'

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

/** 상태 셀 — 점(5xx만 빨강) + 숫자 */
function StatusCell({ status }: { status: number }) {
  const danger = status >= 500
  return (
    <span className={s.statusCell}>
      <span className={`${s.statusDot} ${danger ? s.statusDotDanger : ''}`} />
      <span className={`${s.status} ${danger ? s.statusDanger : ''}`}>{status}</span>
    </span>
  )
}

// ─── 아이콘 ───────────────────────────────────────────────────────────────────

function RefreshIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      className={`${s.btnIcon} ${spinning ? s.spin : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      className={s.btnIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function RestoreIcon() {
  return (
    <svg
      className={s.btnIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7v6h6" />
      <path d="M3.51 13a9 9 0 1 0 2.13-9.36L3 7" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg
      className={s.emptyIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
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

  // ─── 요약 상태 ─────────────────────────────────────────────────────────────
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [errorSummary, setErrorSummary] = useState<ErrorLogSummary | null>(null)
  const [regSummary, setRegSummary] = useState<RegistrationLogSummary | null>(null)
  const [deleteSummary, setDeleteSummary] = useState<DeleteLogSummary | null>(null)

  // ─── 필터 상태 ─────────────────────────────────────────────────────────────
  const [quickRange, setQuickRange] = useState<QuickRange>('today')
  const [fromDate, setFromDate] = useState<string>(todayStr())
  const [toDate, setToDate] = useState<string>(todayStr())
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('all')

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

  // 요약은 기간(from~to)에만 의존 — 페이지 변경 시에는 재조회하지 않는다.
  const loadSummary = useCallback(
    async (from = fromDate, to = toDate) => {
      setSummaryLoading(true)
      try {
        if (tab === 'error') {
          setErrorSummary(await getErrorLogSummary(token, from, to))
        } else if (tab === 'registration') {
          setRegSummary(await getRegistrationLogSummary(token, from, to))
        } else {
          setDeleteSummary(await getDeleteLogSummary(token, from, to))
        }
      } catch (err) {
        handleUnauthorized(err)
      } finally {
        setSummaryLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, tab, handleUnauthorized],
  )

  useEffect(() => {
    setPage(0)
    load(0, fromDate, toDate, statusGroup)
    loadSummary(fromDate, toDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, load, loadSummary])

  useEffect(() => {
    if (autoRefresh) {
      pollRef.current = setInterval(() => {
        load(page, fromDate, toDate, statusGroup)
        loadSummary(fromDate, toDate)
      }, POLL_INTERVAL_MS)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [autoRefresh, load, loadSummary, page, fromDate, toDate, statusGroup])

  const handlePageChange = (next: number) => {
    setPage(next)
    load(next, fromDate, toDate, statusGroup)
  }

  const handleSearch = () => {
    setPage(0)
    load(0, fromDate, toDate, statusGroup)
    loadSummary(fromDate, toDate)
  }

  const handleManualRefresh = () => {
    load(page, fromDate, toDate, statusGroup)
    loadSummary(fromDate, toDate)
  }

  // 에러 통계 항목 클릭 → 해당 status group 으로 즉시 조회
  const handleStatusSelect = (sg: StatusGroup) => {
    setStatusGroup(sg)
    setPage(0)
    load(0, fromDate, toDate, sg)
  }

  const handleRestore = useCallback(
    async (logId: number) => {
      try {
        const updated = await restoreDeleteLog(token, logId)
        setDeleteLogs((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            content: prev.content.map((entry) => (entry.id === updated.id ? updated : entry)),
          }
        })
        loadSummary(fromDate, toDate)
      } catch (err) {
        handleUnauthorized(err)
        if (err instanceof ApiError) {
          alert(`복원 실패: ${err.message}`)
        }
      }
    },
    [token, handleUnauthorized, loadSummary, fromDate, toDate],
  )

  const currentData = tab === 'error' ? errorLogs : tab === 'registration' ? regLogs : deleteLogs

  return (
    <div className={s.container}>
      {/* 헤더: 텍스트 탭 + 액션 */}
      <div className={s.header}>
        <div className={s.tabBar}>
          <button
            className={tab === 'error' ? s.tabActive : s.tab}
            onClick={() => setTab('error')}
            type="button"
          >
            에러 로그
          </button>
          <button
            className={tab === 'registration' ? s.tabActive : s.tab}
            onClick={() => setTab('registration')}
            type="button"
          >
            회원가입 로그
          </button>
          <button
            className={tab === 'delete' ? s.tabActive : s.tab}
            onClick={() => setTab('delete')}
            type="button"
          >
            삭제 로그
          </button>
        </div>

        <div className={s.actions}>
          {tab !== 'delete' && (
            <button
              type="button"
              className={autoRefresh ? s.btnLiveOn : s.btnLive}
              onClick={() => setAutoRefresh((v) => !v)}
            >
              {autoRefresh ? <span className={s.liveDot} /> : <RefreshIcon />}
              자동 새로고침
            </button>
          )}
          <button type="button" className={s.btnRefresh} onClick={handleManualRefresh}>
            <RefreshIcon spinning={loading} />
            새로고침
          </button>
        </div>
      </div>

      {/* 인라인 통계 스트립 */}
      <StatStrip
        tab={tab}
        loading={summaryLoading}
        errorSummary={errorSummary}
        regSummary={regSummary}
        deleteSummary={deleteSummary}
        statusGroup={statusGroup}
        onStatusSelect={handleStatusSelect}
      />

      {/* 컨트롤 행 */}
      <div className={s.controls}>
        <div className={s.controlGroup}>
          <span className={s.controlLabel}>기간</span>
          <div className={s.segGroup}>
            {(['today', '1m', '3m'] as const).map((range) => (
              <button
                key={range}
                type="button"
                className={quickRange === range ? s.segBtnActive : s.segBtn}
                onClick={() => applyQuickRange(range)}
              >
                {range === 'today' ? '오늘' : range === '1m' ? '1개월' : '3개월'}
              </button>
            ))}
          </div>
        </div>

        <div className={s.controlGroup}>
          <MiniDatePicker value={fromDate} max={toDate} onChange={handleFromDateChange} />
          <span className={s.dateSep}>~</span>
          <MiniDatePicker value={toDate} min={fromDate} max={todayStr()} onChange={handleToDateChange} />
        </div>

        <button type="button" className={s.btnSearch} onClick={handleSearch}>
          <SearchIcon />
          조회
        </button>
      </div>

      {/* 본문 */}
      {loading ? (
        <Skeleton height="360px" />
      ) : tab === 'error' ? (
        <ErrorLogTable logs={errorLogs} />
      ) : tab === 'registration' ? (
        <RegistrationLogTable logs={regLogs} />
      ) : (
        <DeleteLogTable logs={deleteLogs} onRestore={handleRestore} />
      )}

      {currentData && currentData.totalPages > 1 && (
        <div className={s.pagination}>
          <Pagination
            page={page}
            totalPages={currentData.totalPages}
            onPageChange={handlePageChange}
            disabled={loading}
          />
        </div>
      )}
    </div>
  )
}

// ─── 인라인 통계 스트립 ───────────────────────────────────────────────────────

const PROVIDER_ORDER = ['LOCAL', 'KAKAO', 'GOOGLE']
const PROVIDER_LABEL: Record<string, string> = {
  LOCAL: '이메일',
  KAKAO: '카카오',
  GOOGLE: '구글',
}
const TARGET_ORDER = ['USER', 'GROUP', 'POST', 'IMAGE']

function normalizeProviders(byProvider: Record<string, number>): [string, number][] {
  const merged: Record<string, number> = {}
  for (const [k, v] of Object.entries(byProvider)) {
    const key = k.toUpperCase()
    merged[key] = (merged[key] ?? 0) + v
  }
  return Object.keys(merged)
    .sort((a, b) => {
      const ia = PROVIDER_ORDER.indexOf(a)
      const ib = PROVIDER_ORDER.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
    .map((k) => [k, merged[k]] as [string, number])
}

function Stat({ label, value, valueClass }: { label: string; value: number; valueClass?: string }) {
  return (
    <span className={s.stat}>
      <span className={`${s.statValue} ${valueClass ?? ''}`}>{value.toLocaleString()}</span>
      <span className={s.statLabel}>{label}</span>
    </span>
  )
}

function ClickableStat({
  label,
  value,
  valueClass,
  active,
  onClick,
}: {
  label: string
  value: number
  valueClass?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${s.statButton} ${active ? '' : s.statDim}`}
    >
      <span className={`${s.statValue} ${valueClass ?? ''}`}>{value.toLocaleString()}</span>
      <span className={s.statLabel}>{label}</span>
    </button>
  )
}

function Divider() {
  return <span className={s.statDivider} aria-hidden="true" />
}

function StatStrip({
  tab,
  loading,
  errorSummary,
  regSummary,
  deleteSummary,
  statusGroup,
  onStatusSelect,
}: {
  tab: Tab
  loading: boolean
  errorSummary: ErrorLogSummary | null
  regSummary: RegistrationLogSummary | null
  deleteSummary: DeleteLogSummary | null
  statusGroup: StatusGroup
  onStatusSelect: (sg: StatusGroup) => void
}) {
  const summary = tab === 'error' ? errorSummary : tab === 'registration' ? regSummary : deleteSummary

  if (loading && !summary) {
    return (
      <div className={s.statStripSkeleton}>
        <Skeleton width="80px" height="40px" />
        <Skeleton width="80px" height="40px" />
        <Skeleton width="80px" height="40px" />
      </div>
    )
  }

  if (tab === 'error') {
    if (!errorSummary) return null
    return (
      <div className={s.statStrip}>
        <ClickableStat
          label="전체"
          value={errorSummary.total}
          active={statusGroup === 'all'}
          onClick={() => onStatusSelect('all')}
        />
        <Divider />
        <ClickableStat
          label="4xx 클라이언트"
          value={errorSummary.count4xx}
          active={statusGroup === '4xx'}
          onClick={() => onStatusSelect('4xx')}
        />
        <Divider />
        <ClickableStat
          label="5xx 서버"
          value={errorSummary.count5xx}
          valueClass={s.statValueDanger}
          active={statusGroup === '5xx'}
          onClick={() => onStatusSelect('5xx')}
        />
      </div>
    )
  }

  if (tab === 'registration') {
    if (!regSummary) return null
    const providers = normalizeProviders(regSummary.byProvider)
    return (
      <div className={s.statStrip}>
        <Stat label="전체" value={regSummary.total} />
        {providers.map(([key, count]) => (
          <Fragment key={key}>
            <Divider />
            <Stat label={PROVIDER_LABEL[key] ?? key} value={count} />
          </Fragment>
        ))}
      </div>
    )
  }

  if (!deleteSummary) return null
  const types = TARGET_ORDER.filter((t) => deleteSummary.byTargetType[t] != null).map(
    (t) => [t, deleteSummary.byTargetType[t]] as [string, number],
  )
  return (
    <div className={s.statStrip}>
      <Stat label="전체" value={deleteSummary.total} />
      <Divider />
      <Stat label="미복원" value={deleteSummary.pending} />
      <Divider />
      <Stat label="복원됨" value={deleteSummary.restored} />
      {types.map(([key, count]) => (
        <Fragment key={key}>
          <Divider />
          <Stat label={targetTypeLabel(key)} value={count} />
        </Fragment>
      ))}
    </div>
  )
}

// ─── 빈 상태 ─────────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className={s.emptyState}>
      <InboxIcon />
      <span className={s.emptyText}>{text}</span>
      <span className={s.emptyHint}>다른 기간이나 필터로 조회해 보세요.</span>
    </div>
  )
}

/** 상세 정보가 하나라도 존재하면 true */
function hasDetail(entry: ErrorLogEntry): boolean {
  return !!(entry.errorMessage || entry.requestBody || entry.queryParams || entry.stacktrace)
}

function ErrorLogTable({ logs }: { logs: LogPageResponse<ErrorLogEntry> | null }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (!logs) return null
  if (logs.content.length === 0) {
    return <EmptyState text="에러 로그가 없습니다." />
  }

  const handleRowClick = (i: number, entry: ErrorLogEntry) => {
    if (!hasDetail(entry)) return
    setExpandedIndex(expandedIndex === i ? null : i)
  }

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
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
                className={hasDetail(entry) ? s.rowClickable : undefined}
                onClick={() => handleRowClick(i, entry)}
              >
                <td className={s.cellTime}>{formatDateTime(entry.timestamp)}</td>
                <td>
                  <span className={s.method}>{entry.method}</span>
                </td>
                <td className={s.cellPath} title={entry.path}>
                  {entry.path}
                </td>
                <td>
                  <StatusCell status={entry.status} />
                  {hasDetail(entry) && (
                    <span className={s.expandIcon}>{expandedIndex === i ? '▼' : '▶'}</span>
                  )}
                </td>
                <td className={s.cellMono}>{entry.ip}</td>
                <td className={s.cellMono}>{entry.username ?? entry.ip}</td>
              </tr>
              {hasDetail(entry) && expandedIndex === i && (
                <tr className={s.detailRow}>
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
    <div className={s.detailPanel}>
      {entry.errorMessage && (
        <div className={s.detailSection}>
          <span className={s.detailLabel}>에러 메시지</span>
          <pre className={s.detailMono}>{entry.errorMessage}</pre>
        </div>
      )}
      {entry.queryParams && (
        <div className={s.detailSection}>
          <span className={s.detailLabel}>쿼리 파라미터</span>
          <pre className={s.detailMono}>{entry.queryParams}</pre>
        </div>
      )}
      {entry.requestBody && (
        <div className={s.detailSection}>
          <span className={s.detailLabel}>요청 바디</span>
          <pre className={s.detailMono}>{prettyJson(entry.requestBody)}</pre>
        </div>
      )}
      {entry.stacktrace && (
        <div className={s.detailSection}>
          <span className={s.detailLabel}>스택트레이스</span>
          <pre className={s.stacktracePre}>{entry.stacktrace}</pre>
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

function RegistrationLogTable({ logs }: { logs: LogPageResponse<RegistrationLogEntry> | null }) {
  if (!logs) return null
  if (logs.content.length === 0) {
    return <EmptyState text="회원가입 로그가 없습니다." />
  }
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
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
              <td className={s.cellTime}>{formatDateTime(entry.timestamp)}</td>
              <td className={s.cellMono}>{entry.username}</td>
              <td className={s.cellEmail}>{entry.email}</td>
              <td>
                <span className={s.provider}>{providerLabel(entry.provider)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function providerLabel(provider: string): string {
  const p = (provider ?? '').toUpperCase()
  return PROVIDER_LABEL[p] ?? provider
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
    return <EmptyState text="삭제 로그가 없습니다." />
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
    <div className={s.tableWrap}>
      <table className={s.table}>
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
              <td className={s.cellMono}>{entry.deletedBy}</td>
              <td>
                <span className={s.targetType}>{targetTypeLabel(entry.targetType)}</span>
              </td>
              <td className={s.cellSummary} title={entry.targetSummary}>
                {entry.targetSummary}
              </td>
              <td className={s.cellReason} title={entry.reason ?? undefined}>
                {entry.reason ?? '-'}
              </td>
              <td className={s.cellTime}>{formatDateTime(entry.deletedAt)}</td>
              <td>
                {entry.restored ? (
                  <span className={s.restored}>복원됨</span>
                ) : (
                  <span className={s.pending}>미복원</span>
                )}
                {entry.restored && entry.restoredBy && (
                  <span className={s.restoredMeta}>by {entry.restoredBy}</span>
                )}
              </td>
              <td>
                {entry.targetType !== 'IMAGE' && !entry.restored ? (
                  <button
                    type="button"
                    className={s.btnRestore}
                    disabled={restoringId === entry.id}
                    onClick={() => handleRestore(entry.id)}
                  >
                    <RestoreIcon />
                    {restoringId === entry.id ? '복원 중...' : '복원'}
                  </button>
                ) : (
                  <span className={s.noAction}>{entry.targetType === 'IMAGE' ? '불가' : '-'}</span>
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
    case 'USER':
      return '사용자'
    case 'GROUP':
      return '모임'
    case 'POST':
      return '게시글'
    case 'IMAGE':
      return '이미지'
    default:
      return type
  }
}
