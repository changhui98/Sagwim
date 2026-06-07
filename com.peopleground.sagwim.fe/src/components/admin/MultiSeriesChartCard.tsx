import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Skeleton } from '../common/Skeleton'
import styles from './MultiSeriesChartCard.module.css'

export interface ChartSeries {
  key: string
  label: string
  unit: string
  color: string
}

export interface MergedChartPoint {
  month: string
  label: string
  fullLabel: string
  [seriesKey: string]: string | number
}

interface MultiSeriesChartCardProps {
  data: MergedChartPoint[]
  series: readonly ChartSeries[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

interface TooltipRenderProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
}

interface SeriesSummary {
  current: number // 최신 달 값
  delta: number | null // 전월 대비 증감 퍼센트 (정수), 계산 불가 시 null
  isNew: boolean // 직전 달 0, 최신 달 > 0 (신규 진입)
}

function summarizeSeries(
  key: string,
  latest: MergedChartPoint | undefined,
  prev: MergedChartPoint | undefined,
): SeriesSummary {
  const current = Number(latest?.[key] ?? 0)
  if (!prev) {
    return { current, delta: null, isNew: false }
  }
  const prevVal = Number(prev[key] ?? 0)
  if (prevVal === 0) {
    return { current, delta: null, isNew: current > 0 }
  }
  return {
    current,
    delta: Math.round(((current - prevVal) / prevVal) * 100),
    isNew: false,
  }
}

function renderTooltip(
  { active, payload }: TooltipRenderProps,
  series: readonly ChartSeries[],
  selected: ReadonlySet<string>,
) {
  if (!active || !payload || payload.length === 0) return null
  const datum = payload[0].payload as MergedChartPoint | undefined
  if (!datum) return null
  const visible = series.filter((s) => selected.has(s.key))
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{datum.fullLabel}</p>
      {visible.map((s) => (
        <p key={s.key} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: s.color }} />
          <span className={styles.tooltipName}>{s.label}</span>
          <span className={styles.tooltipValue}>
            {Number(datum[s.key] ?? 0).toLocaleString()}
            <span className={styles.tooltipUnit}>{s.unit}</span>
          </span>
        </p>
      ))}
    </div>
  )
}

export function MultiSeriesChartCard({
  data,
  series,
  loading = false,
  error = null,
  onRetry,
}: MultiSeriesChartCardProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set<string>())

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const latest = data.length > 0 ? data[data.length - 1] : undefined
  const prev = data.length > 1 ? data[data.length - 2] : undefined

  return (
    <div className={styles.card}>
      <div className={styles.chips}>
        {series.map((s) => {
          const active = selected.has(s.key)
          return (
            <button
              key={s.key}
              type="button"
              className={active ? styles.chipActive : styles.chip}
              onClick={() => toggle(s.key)}
              aria-pressed={active}
            >
              <span
                className={styles.legendDot}
                style={{ background: active ? s.color : 'transparent', borderColor: s.color }}
              />
              {s.label}
            </button>
          )
        })}
      </div>

      <div className={styles.chartArea}>
        {loading ? (
          <Skeleton height="440px" />
        ) : error ? (
          <div className={styles.errorBox}>
            <span>{error}</span>
            {onRetry && (
              <button className={styles.retryButton} onClick={onRetry} type="button">
                다시 시도
              </button>
            )}
          </div>
        ) : selected.size === 0 ? (
          <div className={styles.emptyBox}>표시할 지표를 선택하세요</div>
        ) : (
          <ResponsiveContainer width="100%" height={440}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: 'var(--clr-border-strong)', strokeWidth: 1 }}
                content={(props: TooltipRenderProps) =>
                  renderTooltip(props, series, selected)
                }
              />
              {series
                .filter((s) => selected.has(s.key))
                .map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: s.color, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {selected.size > 0 && !loading && !error && (
        <div className={styles.summaryRow}>
          {[...selected].map((key) => {
            const s = series.find((x) => x.key === key)
            if (!s) return null
            const { current, delta, isNew } = summarizeSeries(key, latest, prev)
            return (
              <div key={s.key} className={styles.summaryCard}>
                <div className={styles.summaryHead}>
                  <span
                    className={styles.legendDot}
                    style={{ background: s.color, borderColor: s.color }}
                  />
                  <span className={styles.summaryLabel}>{s.label}</span>
                </div>
                <div className={styles.summaryValue}>
                  {current.toLocaleString()}
                  <span className={styles.summaryUnit}>{s.unit}</span>
                </div>
                {isNew ? (
                  <span className={`${styles.summaryDelta} ${styles.deltaUp}`}>
                    신규
                  </span>
                ) : delta === null ? (
                  <span className={`${styles.summaryDelta} ${styles.deltaFlat}`}>
                    – 비교 데이터 없음
                  </span>
                ) : delta > 0 ? (
                  <span className={`${styles.summaryDelta} ${styles.deltaUp}`}>
                    ▲ {delta}% 전월대비
                  </span>
                ) : delta < 0 ? (
                  <span className={`${styles.summaryDelta} ${styles.deltaDown}`}>
                    ▼ {Math.abs(delta)}% 전월대비
                  </span>
                ) : (
                  <span className={`${styles.summaryDelta} ${styles.deltaFlat}`}>
                    – 변동 없음
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
