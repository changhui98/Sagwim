/**
 * FeaturesSection — FE landing/FeaturesSection.tsx 이식 (모바일 레이아웃: 텍스트 위·목업 아래).
 * 기능 행 3개(모임/게시판/실시간 채팅) + 순수 뷰 목업 3종 완전 재현.
 * 행별 tone(파스텔 pill·목업 배지·좋아요 색)은 랜딩 팔레트 사용.
 */

import React, { useId } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg'
import { useLandingPalette, type LandingPalette } from '../../constants/landing'
import { fontSize, radius, shadow, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import type { AppColors } from '../../constants/theme'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'

/* ── 풍경 "사진" SVG (노을 + 산 + 호수) — 웹 ScenePhoto 그대로 ── */
function ScenePhoto() {
  const uid = useId().replace(/:/g, '')
  const skyId = `scene-sky-${uid}`
  const waterId = `scene-water-${uid}`
  return (
    <View style={sceneStyles.thumb}>
      <Svg width="100%" height={96} viewBox="0 0 320 104" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C6D5EC" />
            <Stop offset="0.55" stopColor="#A8BDDE" />
            <Stop offset="1" stopColor="#91A8D0" />
          </LinearGradient>
          <LinearGradient id={waterId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#A8BDDE" />
            <Stop offset="1" stopColor="#7E97C9" />
          </LinearGradient>
        </Defs>
        <Rect width={320} height={104} fill={`url(#${skyId})`} />
        <Circle cx={232} cy={40} r={17} fill="#eef3fa" opacity={0.95} />
        <Path d="M0,64 L54,40 L104,60 L150,34 L210,62 L268,42 L320,66 L320,80 L0,80 Z" fill="#8FA6CF" opacity={0.8} />
        <Path d="M0,78 L70,54 L128,74 L182,52 L246,76 L320,58 L320,104 L0,104 Z" fill="#6E88BE" />
        <Rect y={86} width={320} height={18} fill={`url(#${waterId})`} opacity={0.85} />
        <Circle cx={232} cy={92} r={9} fill="#eef3fa" opacity={0.45} />
      </Svg>
    </View>
  )
}

const sceneStyles = StyleSheet.create({
  thumb: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.sp3 },
})

interface MockProps {
  colors: AppColors
  palette: LandingPalette
  tone: number
}

function GroupMock({ colors, palette, tone }: MockProps) {
  const s = mockStyles(colors)
  return (
    <View style={s.card}>
      <ScenePhoto />
      <View style={s.groupBody}>
        <View style={[s.badge, { backgroundColor: palette.pastel[tone].bg }]}>
          <Text style={[s.badgeText, { color: palette.pastel[tone].fg }]}>오프라인 · 모집중</Text>
        </View>
        <View style={[s.line, s.w70]} />
        <View style={[s.line, s.w40, s.lineMuted]} />
        <View style={s.avatars}>
          <View style={s.avatar} />
          <View style={[s.avatar, s.avatarOverlap]} />
          <View style={[s.avatar, s.avatarOverlap]} />
          <View style={[s.avatar, s.avatarOverlap, s.avatarMore]}>
            <Text style={s.avatarMoreText}>+8</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

/* 게시판 목업 예시 글 — 웹 BOARD_POSTS 그대로 */
const BOARD_POSTS = [
  { initial: '은', name: '은지', time: '10분 전', text: '오늘 한강 러닝 모임 최고였어요 🏃', likes: 12, tone: 2 },
  { initial: '준', name: '준호', time: '1시간 전', text: '역 앞에 새로 생긴 카페 같이 가실 분?', likes: 8, tone: 0 },
  { initial: '소', name: '소연', time: '어제', text: '독서 모임 이번 주 책 후기 남겨요 📚', likes: 21, tone: 4 },
]

function BoardMock({ colors, palette, tone }: MockProps) {
  const s = mockStyles(colors)
  return (
    <View style={s.card}>
      {BOARD_POSTS.map((p, i) => (
        <View key={p.name} style={[s.post, i < BOARD_POSTS.length - 1 && s.postDivider]}>
          <View style={[s.postAvatar, { backgroundColor: palette.pastel[p.tone].bg }]}>
            <Text style={[s.postAvatarText, { color: palette.pastel[p.tone].fg }]}>{p.initial}</Text>
          </View>
          <View style={s.postBody}>
            <View style={s.postMeta}>
              <Text style={s.postName}>{p.name}</Text>
              <Text style={s.postTime}>{p.time}</Text>
            </View>
            <Text style={s.postText} numberOfLines={1}>{p.text}</Text>
          </View>
          <Text style={[s.postLikes, { color: palette.pastel[tone].fg }]}>♥ {p.likes}</Text>
        </View>
      ))}
    </View>
  )
}

function ChatMock({ colors, palette }: MockProps) {
  const s = mockStyles(colors)
  // 채팅 행 톤(아쿠아)과 일치 — 텍스트 대비를 위해 fg 가 아닌 미드톤 사용
  const outBg = palette.tones[5]
  const outText = palette.isDark ? '#0a0a0a' : '#ffffff'
  return (
    <View style={[s.card, s.chat]}>
      <View style={[s.bubble, s.bubbleIn]}>
        <Text style={s.bubbleInText}>이번 주 토요일 어때요?</Text>
      </View>
      <View style={[s.bubble, s.bubbleOut, { backgroundColor: outBg }]}>
        <Text style={[s.bubbleOutText, { color: outText }]}>좋아요! 몇 시에 모일까요?</Text>
      </View>
      <View style={[s.bubble, s.bubbleIn]}>
        <Text style={s.bubbleInText}>10시에 동네 카페에서 봐요 ☕</Text>
      </View>
    </View>
  )
}

const mockStylesCache = new Map<AppColors, ReturnType<typeof buildMockStyles>>()
function mockStyles(colors: AppColors) {
  let s = mockStylesCache.get(colors)
  if (!s) {
    s = buildMockStyles(colors)
    mockStylesCache.set(colors, s)
  }
  return s
}

function buildMockStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      width: '100%',
      maxWidth: 320,
      padding: spacing.sp4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      ...shadow.md,
    },
    groupBody: { gap: spacing.sp2, alignItems: 'flex-start' },
    badge: {
      paddingVertical: 2,
      paddingHorizontal: spacing.sp2,
      borderRadius: radius.full,
    },
    badgeText: { fontSize: 11, fontWeight: '700' },
    line: { height: 9, borderRadius: radius.full, backgroundColor: colors.surface3 },
    lineMuted: { opacity: 0.6 },
    w40: { width: '40%' },
    w70: { width: '70%' },
    avatars: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sp1 },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.surface3,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    avatarOverlap: { marginLeft: -6 },
    avatarMore: { alignItems: 'center', justifyContent: 'center' },
    avatarMoreText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
    post: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sp3,
      paddingVertical: spacing.sp3,
    },
    postDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    postAvatar: {
      width: 32,
      height: 32,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    postAvatarText: { fontSize: fontSize.xs, fontWeight: '700' },
    postBody: { flex: 1, minWidth: 0, gap: 2 },
    postMeta: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sp2 },
    postName: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text },
    postTime: { fontSize: 11, color: colors.textMuted },
    postText: { fontSize: fontSize.sm, lineHeight: 18, color: colors.textSecondary },
    postLikes: { fontSize: fontSize.xs, fontWeight: '600' },
    chat: { gap: spacing.sp2 },
    bubble: {
      maxWidth: '80%',
      paddingVertical: spacing.sp2,
      paddingHorizontal: spacing.sp3,
      borderRadius: radius.lg,
    },
    bubbleIn: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface3,
      borderBottomLeftRadius: radius.sm,
    },
    bubbleInText: { fontSize: fontSize.base, lineHeight: 20, color: colors.text },
    bubbleOut: { alignSelf: 'flex-end', borderBottomRightRadius: radius.sm },
    bubbleOutText: { fontSize: fontSize.base, lineHeight: 20 },
  })
}

interface Feature {
  tag: string
  title: string
  desc: string
  tone: number
  Mock: (props: MockProps) => React.ReactElement
}

const FEATURES: Feature[] = [
  {
    tag: '모임',
    title: '관심사로 모이는 우리 동네 모임',
    desc: '카테고리·지역·인원으로 딱 맞는 모임을 찾고, 원하는 모임이 없다면 직접 만들어 이웃을 초대하세요.',
    tone: 0,
    Mock: GroupMock,
  },
  {
    tag: '게시판',
    title: '동네 소식과 일상을 나누는 게시판',
    desc: '모임 안에서, 또 동네 안에서 사진과 이야기를 공유하고 댓글과 좋아요로 가볍게 소통해요.',
    tone: 1,
    Mock: BoardMock,
  },
  {
    tag: '실시간 채팅',
    title: '바로 통하는 실시간 채팅',
    desc: '약속을 잡을 때도, 안부를 물을 때도. 모임원과 실시간으로 메시지를 주고받아요.',
    tone: 5,
    Mock: ChatMock,
  },
]

export function FeaturesSection() {
  const { colors } = useTheme()
  const palette = useLandingPalette()

  const styles = React.useMemo(() => StyleSheet.create({
    section: {
      paddingVertical: spacing.sp10,
      paddingHorizontal: spacing.sp6,
      backgroundColor: colors.surface2,
    },
    rows: { gap: spacing.sp10 },
    row: { alignItems: 'center', gap: spacing.sp6 },
    text: { alignItems: 'center' },
    tag: {
      paddingVertical: spacing.sp1,
      paddingHorizontal: spacing.sp3,
      borderRadius: radius.full,
      marginBottom: spacing.sp3,
    },
    tagText: { fontSize: 13, fontWeight: '700' },
    rowTitle: {
      fontSize: fontSize.xl2,
      fontWeight: '800',
      letterSpacing: -0.4,
      lineHeight: 26,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.sp3,
    },
    rowDesc: {
      fontSize: fontSize.md,
      lineHeight: 25,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    mock: { width: '100%', alignItems: 'center' },
  }), [colors])

  return (
    <View style={styles.section}>
      <Reveal>
        <SectionHead
          title="사귐으로 할 수 있는 것"
          lead="모임을 찾고, 이야기를 나누고, 실시간으로 소통하세요."
        />
      </Reveal>

      <View style={styles.rows}>
        {FEATURES.map((f) => (
          <Reveal key={f.tag}>
            <View style={styles.row}>
              <View style={styles.text}>
                <View style={[styles.tag, { backgroundColor: palette.pastel[f.tone].bg }]}>
                  <Text style={[styles.tagText, { color: palette.pastel[f.tone].fg }]}>{f.tag}</Text>
                </View>
                <Text style={styles.rowTitle}>{f.title}</Text>
                <Text style={styles.rowDesc}>{f.desc}</Text>
              </View>
              <View style={styles.mock}>
                <f.Mock colors={colors} palette={palette} tone={f.tone} />
              </View>
            </View>
          </Reveal>
        ))}
      </View>
    </View>
  )
}
