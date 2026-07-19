import { useNavigate } from 'react-router-dom'
import {
  ChatIcon,
  HomeIcon,
  IdeaIcon,
  PostsIcon,
  SavedIcon,
  ShieldIcon,
  UserCircleIcon,
} from '../components/NavIcons'
import styles from './SettingsPage.module.css'

/** 푸터 링크 이관 섹션 — 모바일에서는 푸터가 숨겨지므로 설정에서 동일 링크를 제공한다 */
const LINK_SECTIONS = [
  {
    key: 'support',
    label: '고객지원',
    HeaderIcon: ChatIcon,
    items: [
      {
        key: 'helpCenter',
        title: '고객센터',
        desc: '이용 중 필요한 도움을 받아보세요',
        to: '/support',
        Icon: UserCircleIcon,
        tone: 5, // 아쿠아 — 안내·응대
      },
      {
        key: 'faq',
        title: '자주 묻는 질문',
        desc: '자주 묻는 질문과 답변을 모아봅니다',
        to: '/faq',
        Icon: IdeaIcon,
        tone: 4, // 아프리콧 — 아이디어 웜톤
      },
      {
        key: 'inquiry',
        title: '1:1 문의',
        desc: '궁금한 점을 직접 문의합니다',
        to: '/inquiry',
        Icon: ChatIcon,
        tone: 1, // 라벤더 — 대화
      },
    ],
  },
  {
    key: 'serviceInfo',
    label: '서비스 정보',
    HeaderIcon: HomeIcon,
    items: [
      {
        key: 'about',
        title: '회사 소개',
        desc: 'Sagwim이 만들어가는 이야기를 소개합니다',
        to: '/about',
        Icon: HomeIcon,
        tone: 1, // 라벤더 — 브랜드 세컨더리
      },
      {
        key: 'notice',
        title: '공지사항',
        desc: '서비스의 새로운 소식을 확인합니다',
        to: '/notice',
        Icon: SavedIcon,
        tone: 0, // 세레니티 — 중립 안내
      },
      {
        key: 'terms',
        title: '이용약관',
        desc: '서비스 이용약관을 확인합니다',
        to: '/terms',
        Icon: PostsIcon,
        tone: 5, // 아쿠아 — 문서
      },
      {
        key: 'privacy',
        title: '개인정보처리방침',
        desc: '개인정보 보호 정책을 확인합니다',
        to: '/privacy',
        Icon: ShieldIcon,
        tone: 3, // 세이지 — 보안·안전 (비밀번호 변경과 동일 계열)
      },
    ],
  },
] as const

function ChevronRight() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function SettingsSupportPage() {
  const navigate = useNavigate()

  return (
    <>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <h2 className={styles.panelTitle}>고객지원</h2>
          <p className={styles.panelSubtitle}>
            고객지원과 서비스 정보를 확인합니다
          </p>
        </div>
      </div>

      {LINK_SECTIONS.map(({ key, label, HeaderIcon, items }) => (
        <div key={key} className={styles.accountSection}>
          <div className={styles.accountSectionHeader}>
            <HeaderIcon width={16} height={16} />
            <span className={styles.accountSectionLabel}>{label}</span>
          </div>

          <div className={styles.cardGrid}>
            {items.map(({ key: itemKey, title, desc, to, Icon, tone }) => (
              <button
                key={itemKey}
                type="button"
                className={`${styles.featureCard} tone-${tone}`}
                onClick={() => navigate(to)}
                aria-label={`${title} 페이지로 이동`}
              >
                <div className={styles.featureCardIconWrap} aria-hidden="true">
                  <Icon width={22} height={22} />
                </div>
                <div className={styles.featureCardBody}>
                  <p className={styles.featureCardTitle}>{title}</p>
                  <p className={styles.featureCardDesc}>{desc}</p>
                </div>
                <div className={styles.featureCardArrow} aria-hidden="true">
                  <ChevronRight />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <p className={styles.serviceCopyright}>
        © 2026 Sagwim. All rights reserved.
      </p>
    </>
  )
}
