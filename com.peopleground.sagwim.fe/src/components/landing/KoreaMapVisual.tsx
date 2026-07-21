import type { CSSProperties } from 'react'
import styles from './KoreaMapVisual.module.css'

/**
 * 남한 실루엣 위에 동네 거점(사람 + 머리 위 위치 핀)을 세우고
 * 핀끼리 선으로 연결되는 비주얼. SVG + CSS 애니메이션으로만 구현한다.
 *
 * - 연결선은 stroke-dashoffset 으로 "그려지는" 연출
 * - 핀/사람은 순차 등장(pop-in)
 * - 핀 아래 발밑 원이 펄스
 * - prefers-reduced-motion 에서는 모든 애니메이션 정지(완성 상태로 고정)
 *
 * 좌표계: viewBox 300 x 400. 각 노드의 (x, y)는 핀의 뾰족한 끝(tip) 위치이며,
 * 사람은 그 아래에, 핀 원의 중심은 tip 위쪽(y - 20)에 위치한다.
 * 외곽선은 남한 해안선을 위경도 기준으로 양식화한 것이다.
 */

interface Node {
  x: number
  y: number
  /* 랜딩 팔레트(--lp-tone-N) 인덱스 — 핀·펄스 색.
     EDGES 로 이어지는 인접 노드끼리 같은 색이 없도록 배치했다. */
  tone: number
}

// 핀 tip 좌표 (도시 위경도를 외곽선과 동일한 변환식으로 매핑)
const NODES: Node[] = [
  { x: 112, y: 110, tone: 0 }, // 0 서울·경기 — 세레니티(브랜드색)
  { x: 85, y: 127, tone: 5 }, // 1 인천·서해 — 아쿠아
  { x: 208, y: 100, tone: 3 }, // 2 강원 — 세이지
  { x: 130, y: 196, tone: 4 }, // 3 대전·충청 — 아프리콧
  { x: 193, y: 226, tone: 2 }, // 4 대구·경북 — 로즈
  { x: 106, y: 272, tone: 1 }, // 5 광주·호남 — 라벤더
  { x: 214, y: 272, tone: 0 }, // 6 부산·경남 — 세레니티
  { x: 88, y: 349, tone: 3 }, // 7 제주 — 세이지
]

// 핀끼리 연결 (노드 인덱스 쌍)
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [3, 4],
  [3, 5],
  [2, 4],
  [4, 6],
  [5, 6],
  [5, 7],
  [6, 7],
]

// 핀 원의 중심 (tip 기준 위로 20px)
const pinCenter = (n: Node) => ({ cx: n.x, cy: n.y - 20 })

interface KoreaMapVisualProps {
  className?: string
}

export function KoreaMapVisual({ className }: KoreaMapVisualProps) {
  return (
    <svg
      className={[styles.svg, className].filter(Boolean).join(' ')}
      viewBox="0 0 300 400"
      role="img"
      aria-label="남한 지도 위에서 이웃들이 서로 연결되는 모습"
    >
      {/* 남한 실루엣 — 국가 GeoJSON(KOR) 외곽선을 위도보정 후 viewBox 에 정규화 */}
      <path
        className={styles.land}
        d="M180.7,40.0 L228.4,121.0 L242.1,165.6 L242.5,244.7 L221.7,282.4 L171.7,295.6
           L127.6,324.1 L77.8,330.0 L71.7,292.6 L81.9,241.1 L57.5,169.6 L98.5,158.0
           L60.7,99.2 L64.1,93.0 L88.8,95.5 L110.3,64.5 L149.3,61.1 L172.8,56.6 L180.7,40.0 Z"
      />
      {/* 제주 (본토 밖 별도 섬) */}
      <ellipse className={styles.land} cx="88" cy="362" rx="24" ry="11" />

      {/* 연결선 (핀 원 중심끼리) — 그려지는 애니메이션 */}
      <g>
        {EDGES.map(([a, b], i) => {
          const p1 = pinCenter(NODES[a])
          const p2 = pinCenter(NODES[b])
          return (
            <line
              key={`edge-${i}`}
              className={styles.line}
              x1={p1.cx}
              y1={p1.cy}
              x2={p2.cx}
              y2={p2.cy}
              pathLength={1}
              style={{ animationDelay: `${0.5 + i * 0.13}s` }}
            />
          )
        })}
      </g>

      {/* 노드: 발밑 펄스 + 사람 + 핀 */}
      {NODES.map((n, i) => {
        const c = pinCenter(n)
        return (
          <g
            key={`node-${i}`}
            style={{ '--node-tone': `var(--lp-tone-${n.tone})` } as CSSProperties}
          >
            {/* 발밑 펄스 */}
            <ellipse
              className={styles.pulse}
              cx={n.x}
              cy={n.y + 27}
              rx={10}
              ry={3.5}
              style={{ animationDelay: `${1.1 + i * 0.18}s` }}
            />

            {/* 사람 실루엣 (머리 + 어깨) */}
            <g
              className={styles.person}
              style={{ animationDelay: `${0.25 + i * 0.1}s` }}
            >
              <circle cx={n.x} cy={n.y + 9} r={4.6} />
              <path d={`M${n.x - 7},${n.y + 27} a7,8.5 0 0 1 14,0 Z`} />
            </g>

            {/* 위치 핀 (머리 위) */}
            <g
              className={styles.pin}
              style={{ animationDelay: `${0.55 + i * 0.12}s` }}
            >
              <path
                d={`M${n.x},${n.y} C${n.x - 6},${n.y - 9} ${n.x - 10},${n.y - 14} ${n.x - 10},${n.y - 20}
                    a10,10 0 1 1 20,0 C${n.x + 10},${n.y - 14} ${n.x + 6},${n.y - 9} ${n.x},${n.y} Z`}
              />
              <circle className={styles.pinDot} cx={c.cx} cy={c.cy} r={3.8} />
            </g>
          </g>
        )
      })}
    </svg>
  )
}
