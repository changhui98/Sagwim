import type { ReactNode } from 'react'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import styles from './FeaturesSection.module.css'

interface Feature {
  tag: string
  title: string
  desc: string
  visual: ReactNode
  /* 전역 .tone-N 파스텔 브리지 인덱스 */
  tone: number
}

/* ── 각 기능의 미니 목업 (순수 CSS/마크업) ── */

function ScenePhoto() {
  // 임의의 풍경 "사진"처럼 보이는 SVG 일러스트 (노을 + 산 + 호수)
  return (
    <svg
      className={styles.mockThumb}
      viewBox="0 0 320 104"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C6D5EC" />
          <stop offset="0.55" stopColor="#A8BDDE" />
          <stop offset="1" stopColor="#91A8D0" />
        </linearGradient>
        <linearGradient id="scene-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A8BDDE" />
          <stop offset="1" stopColor="#7E97C9" />
        </linearGradient>
      </defs>
      {/* 하늘 */}
      <rect width="320" height="104" fill="url(#scene-sky)" />
      {/* 해 */}
      <circle cx="232" cy="40" r="17" fill="#eef3fa" opacity="0.95" />
      {/* 먼 산 */}
      <path d="M0,64 L54,40 L104,60 L150,34 L210,62 L268,42 L320,66 L320,80 L0,80 Z" fill="#8FA6CF" opacity="0.8" />
      {/* 가까운 산 */}
      <path d="M0,78 L70,54 L128,74 L182,52 L246,76 L320,58 L320,104 L0,104 Z" fill="#6E88BE" />
      {/* 물 반사 */}
      <rect y="86" width="320" height="18" fill="url(#scene-water)" opacity="0.85" />
      <circle cx="232" cy="92" r="9" fill="#eef3fa" opacity="0.45" />
    </svg>
  )
}

/* 모임 목업의 예시 멤버 — 게시판 목업 글쓴이(은지/준호/소연)와 같은 인물·톤 */
const GROUP_MEMBERS = [
  { initial: '은', tone: 2 },
  { initial: '준', tone: 0 },
  { initial: '소', tone: 4 },
]

function GroupMock() {
  return (
    <div className={styles.mockCard}>
      <ScenePhoto />
      <div className={styles.mockBody}>
        <span className={styles.mockBadge}>오프라인 · 모집중</span>
        <p className={styles.mockGroupTitle}>한강 러닝 크루</p>
        <p className={styles.mockGroupMeta}>🏃 운동 · 스포츠 · 11/20명</p>
        <div className={styles.mockAvatars}>
          {GROUP_MEMBERS.map((m) => (
            <span key={m.initial} className={`${styles.mockAvatarInit} tone-${m.tone}`} aria-hidden>
              {m.initial}
            </span>
          ))}
          <span className={styles.mockMore}>+8</span>
        </div>
      </div>
    </div>
  )
}

/* 게시판 목업의 예시 글 — 채팅 목업처럼 실제 콘텐츠로 보여준다.
   아바타는 전역 .tone-N 파스텔 브리지로 글쓴이마다 다른 색 */
const BOARD_POSTS = [
  {
    initial: '은',
    name: '은지',
    time: '10분 전',
    text: '오늘 한강 러닝 모임 최고였어요 🏃',
    likes: 12,
    tone: 2,
  },
  {
    initial: '준',
    name: '준호',
    time: '1시간 전',
    text: '역 앞에 새로 생긴 카페 같이 가실 분?',
    likes: 8,
    tone: 0,
  },
  {
    initial: '소',
    name: '소연',
    time: '어제',
    text: '독서 모임 이번 주 책 후기 남겨요 📚',
    likes: 21,
    tone: 4,
  },
]

function BoardMock() {
  return (
    <div className={styles.mockCard}>
      {BOARD_POSTS.map((p) => (
        <div key={p.name} className={styles.mockPost}>
          <span className={`${styles.mockAvatar} tone-${p.tone}`} aria-hidden>
            {p.initial}
          </span>
          <div className={styles.mockPostBody}>
            <div className={styles.mockPostMeta}>
              <span className={styles.mockPostName}>{p.name}</span>
              <span className={styles.mockPostTime}>{p.time}</span>
            </div>
            <p className={styles.mockPostText}>{p.text}</p>
          </div>
          <span className={styles.mockLikes} aria-hidden>
            ♥ {p.likes}
          </span>
        </div>
      ))}
    </div>
  )
}

function ChatMock() {
  return (
    <div className={`${styles.mockCard} ${styles.mockChat}`}>
      <div className={`${styles.bubble} ${styles.bubbleIn}`}>이번 주 토요일 어때요?</div>
      <div className={`${styles.bubble} ${styles.bubbleOut}`}>좋아요! 몇 시에 모일까요?</div>
      <div className={`${styles.bubble} ${styles.bubbleIn}`}>10시에 동네 카페에서 봐요 ☕</div>
    </div>
  )
}

const FEATURES: Feature[] = [
  {
    tag: '모임',
    title: '관심사로 모이는 우리 동네 모임',
    desc: '카테고리·지역·인원으로 딱 맞는 모임을 찾고, 원하는 모임이 없다면 직접 만들어 이웃을 초대하세요.',
    visual: <GroupMock />,
    tone: 0,
  },
  {
    tag: '게시판',
    title: '동네 소식과 일상을 나누는 게시판',
    desc: '모임 안에서, 또 동네 안에서 사진과 이야기를 공유하고 댓글과 좋아요로 가볍게 소통해요.',
    visual: <BoardMock />,
    tone: 1,
  },
  {
    tag: '실시간 채팅',
    title: '바로 통하는 실시간 채팅',
    desc: '약속을 잡을 때도, 안부를 물을 때도. 모임원과 실시간으로 메시지를 주고받아요.',
    visual: <ChatMock />,
    tone: 5,
  },
]

function FeatureRow({ feature, flip }: { feature: Feature; flip: boolean }) {
  const { ref, hasRevealed } = useRevealOnScroll()

  return (
    <div
      ref={ref}
      className={[
        styles.row,
        // 행 루트에 tone 을 걸어 --tone-bg/fg 가 태그·목업까지 상속되게 한다
        `tone-${feature.tone}`,
        flip ? styles.flip : '',
        hasRevealed ? styles.revealed : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.text}>
        <span className={styles.tag}>{feature.tag}</span>
        <h3 className={styles.rowTitle}>{feature.title}</h3>
        <p className={styles.rowDesc}>{feature.desc}</p>
      </div>
      <div className={styles.mock}>{feature.visual}</div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <h2 className={styles.title}>사귐으로 할 수 있는 것</h2>
          <span className={styles.titleBar} aria-hidden />
          <p className={styles.lead}>모임을 찾고, 이야기를 나누고, 실시간으로 소통하세요.</p>
        </header>

        <div className={styles.rows}>
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.tag} feature={f} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
