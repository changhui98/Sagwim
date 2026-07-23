/**
 * KoreaMapVisual — FE landing/KoreaMapVisual.tsx의 react-native-svg 이식.
 * 남한 실루엣 위 동네 거점(사람+핀) 8개가 연결선으로 이어지는 비주얼.
 *
 * - 좌표·path 데이터는 웹 원본 그대로 (viewBox 300x400)
 * - 연결선: react-native-svg가 pathLength를 지원하지 않으므로 직선 실제 길이를
 *   Math.hypot로 계산해 strokeDasharray=[len,len] + dashoffset len→0으로 "그려지는" 연출
 * - 사람/핀: 웹의 translateY 드롭 대신 opacity 페이드로 단순화(SVG 내 transform 애니 회피)
 * - 발밑 펄스: rx/ry/opacity를 withRepeat로 무한 반복
 * - 접근성 감속 모드: 완성 상태 고정, 펄스 숨김
 */

import React, { useEffect } from 'react'
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg'
import { useLandingPalette } from '../../constants/landing'
import { useTheme } from '../../context/ThemeContext'

const AnimatedLine = Animated.createAnimatedComponent(Line)
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse)
const AnimatedG = Animated.createAnimatedComponent(G)

const EASE = Easing.bezier(0.16, 1, 0.3, 1)

interface Node {
  x: number
  y: number
  /** 랜딩 팔레트(lpTones) 인덱스 — 핀·펄스 색. 인접 노드끼리 같은 색 없음 */
  tone: number
}

// 핀 tip 좌표 (웹 원본 그대로)
const NODES: Node[] = [
  { x: 112, y: 110, tone: 0 }, // 서울·경기 — 세레니티
  { x: 85, y: 127, tone: 5 }, // 인천·서해 — 아쿠아
  { x: 208, y: 100, tone: 3 }, // 강원 — 세이지
  { x: 130, y: 196, tone: 4 }, // 대전·충청 — 아프리콧
  { x: 193, y: 226, tone: 2 }, // 대구·경북 — 로즈
  { x: 106, y: 272, tone: 1 }, // 광주·호남 — 라벤더
  { x: 214, y: 272, tone: 0 }, // 부산·경남 — 세레니티
  { x: 88, y: 349, tone: 3 }, // 제주 — 세이지
]

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [3, 4], [3, 5],
  [2, 4], [4, 6], [5, 6], [5, 7], [6, 7],
]

const pinCenter = (n: Node) => ({ cx: n.x, cy: n.y - 20 })

const LAND_PATH = `M180.7,40.0 L228.4,121.0 L242.1,165.6 L242.5,244.7 L221.7,282.4 L171.7,295.6
  L127.6,324.1 L77.8,330.0 L71.7,292.6 L81.9,241.1 L57.5,169.6 L98.5,158.0
  L60.7,99.2 L64.1,93.0 L88.8,95.5 L110.3,64.5 L149.3,61.1 L172.8,56.6 L180.7,40.0 Z`

function EdgeLine({ a, b, index, stroke, reduced }: {
  a: Node; b: Node; index: number; stroke: string; reduced: boolean
}) {
  const p1 = pinCenter(a)
  const p2 = pinCenter(b)
  const len = Math.hypot(p2.cx - p1.cx, p2.cy - p1.cy)
  const offset = useSharedValue(reduced ? 0 : len)

  useEffect(() => {
    if (!reduced) {
      offset.value = withDelay(500 + index * 130, withTiming(0, { duration: 900, easing: EASE }))
    }
  }, [reduced, index, offset])

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }))

  return (
    <AnimatedLine
      x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy}
      stroke={stroke}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeOpacity={0.55}
      strokeDasharray={[len, len]}
      animatedProps={animatedProps}
    />
  )
}

function MapNode({ node, index, toneColor, personFill, pinDotFill, reduced }: {
  node: Node; index: number; toneColor: string; personFill: string; pinDotFill: string; reduced: boolean
}) {
  const c = pinCenter(node)
  const personOpacity = useSharedValue(reduced ? 0.9 : 0)
  const pinOpacity = useSharedValue(reduced ? 1 : 0)
  const pulse = useSharedValue(0)

  useEffect(() => {
    if (reduced) return
    personOpacity.value = withDelay(250 + index * 100, withTiming(0.9, { duration: 500, easing: EASE }))
    pinOpacity.value = withDelay(550 + index * 120, withTiming(1, { duration: 500, easing: EASE }))
    pulse.value = withDelay(
      1100 + index * 180,
      withRepeat(withTiming(1, { duration: 2600, easing: EASE }), -1, false)
    )
  }, [reduced, index, personOpacity, pinOpacity, pulse])

  const personProps = useAnimatedProps(() => ({ opacity: personOpacity.value }))
  const pinProps = useAnimatedProps(() => ({ opacity: pinOpacity.value }))
  // 웹 groundPulse: scale 0.5→1.8 (rx 10, ry 3.5 기준), opacity 0.45→0 (70% 지점 이후 유지)
  const pulseProps = useAnimatedProps(() => ({
    rx: interpolate(pulse.value, [0, 0.7, 1], [5, 18, 18]),
    ry: interpolate(pulse.value, [0, 0.7, 1], [1.75, 6.3, 6.3]),
    opacity: interpolate(pulse.value, [0, 0.7, 1], [0.45, 0, 0]),
  }))

  return (
    <G>
      {!reduced && (
        <AnimatedEllipse
          cx={node.x} cy={node.y + 27}
          fill={toneColor}
          animatedProps={pulseProps}
        />
      )}
      <AnimatedG fill={personFill} animatedProps={personProps}>
        <Circle cx={node.x} cy={node.y + 9} r={4.6} />
        <Path d={`M${node.x - 7},${node.y + 27} a7,8.5 0 0 1 14,0 Z`} />
      </AnimatedG>
      <AnimatedG animatedProps={pinProps}>
        <Path
          fill={toneColor}
          d={`M${node.x},${node.y} C${node.x - 6},${node.y - 9} ${node.x - 10},${node.y - 14} ${node.x - 10},${node.y - 20}
              a10,10 0 1 1 20,0 C${node.x + 10},${node.y - 14} ${node.x + 6},${node.y - 9} ${node.x},${node.y} Z`}
        />
        <Circle cx={c.cx} cy={c.cy} r={3.8} fill={pinDotFill} />
      </AnimatedG>
    </G>
  )
}

interface KoreaMapVisualProps {
  width: number
}

export function KoreaMapVisual({ width }: KoreaMapVisualProps) {
  const { colors } = useTheme()
  const { tones, isDark } = useLandingPalette()
  const reduced = useReducedMotion()

  // 다크에서도 랜딩 지도는 은은한 세레니티 유지 (KoreaMapVisual.module.css 다크 블록)
  const landFill = isDark ? 'rgba(145, 168, 208, 0.1)' : 'rgba(145, 168, 208, 0.12)'
  const landStroke = '#91A8D0'
  const lineStroke = isDark ? tones[0] : '#91A8D0'

  return (
    <Svg
      width={width}
      height={(width * 400) / 300}
      viewBox="0 0 300 400"
      accessibilityLabel="남한 지도 위에서 이웃들이 서로 연결되는 모습"
    >
      <Path
        d={LAND_PATH}
        fill={landFill}
        stroke={landStroke}
        strokeWidth={1.5}
        strokeOpacity={0.35}
        strokeLinejoin="round"
      />
      <Ellipse
        cx={88} cy={362} rx={24} ry={11}
        fill={landFill}
        stroke={landStroke}
        strokeWidth={1.5}
        strokeOpacity={0.35}
      />

      {EDGES.map(([a, b], i) => (
        <EdgeLine
          key={`edge-${i}`}
          a={NODES[a]} b={NODES[b]}
          index={i}
          stroke={lineStroke}
          reduced={reduced}
        />
      ))}

      {NODES.map((n, i) => (
        <MapNode
          key={`node-${i}`}
          node={n}
          index={i}
          toneColor={tones[n.tone]}
          personFill={colors.textSecondary}
          pinDotFill="#ffffff"
          reduced={reduced}
        />
      ))}
    </Svg>
  )
}
