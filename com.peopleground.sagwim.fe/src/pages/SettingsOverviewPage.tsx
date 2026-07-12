import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useLogout } from '../hooks/useLogout'
import {
  ActivityIcon,
  AlertIcon,
  BookmarkIcon,
  LogoutIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
} from '../components/NavIcons'
import styles from './SettingsPage.module.css'

/** 설정 항목 → 파스텔 톤 고정 매핑 (전역 .tone-N 브리지, 알림 타입 배지 매핑과 동일 방식) */
const CARD_TONE = {
  activity: 2, // 로즈 — 좋아요·활동 (알림 '좋아요' 배지와 동일 계열)
  saved: 5, // 아쿠아 — 보관함
  themeToggle: 1, // 라벤더 — 달·밤, 브랜드 세컨더리
  report: 4, // 아프리콧 — 경고성 웜톤 (error 레드는 탈퇴 전용)
  password: 3, // 세이지 — 보안·안전
  logout: 0, // 세레니티 — 중립 계정 액션
} as const

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

export function SettingsOverviewPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const handleLogout = useLogout()

  const placeholder = (label: string) => window.alert(`${label} 기능은 준비 중입니다.`)

  return (
    <>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <h2 className={styles.panelTitle}>일반</h2>
          <p className={styles.panelSubtitle}>
            활동과 화면, 계정 설정을 관리합니다
          </p>
        </div>
      </div>

      {/* 활동·화면 메뉴 카드 */}
      <div className={styles.cardGrid}>
        <button
          type="button"
          className={`${styles.featureCard} tone-${CARD_TONE.activity}`}
          onClick={() => navigate('/app/activity')}
          aria-label="내 활동 페이지로 이동"
        >
          <div className={styles.featureCardIconWrap} aria-hidden="true">
            <ActivityIcon width={22} height={22} />
          </div>
          <div className={styles.featureCardBody}>
            <p className={styles.featureCardTitle}>내 활동</p>
            <p className={styles.featureCardDesc}>
              좋아요한 게시글·모임과 댓글 단 글을 모아봅니다
            </p>
          </div>
          <div className={styles.featureCardArrow} aria-hidden="true">
            <ChevronRight />
          </div>
        </button>

        <button
          type="button"
          className={`${styles.featureCard} tone-${CARD_TONE.saved}`}
          onClick={() => placeholder('저장됨')}
        >
          <div className={styles.featureCardIconWrap} aria-hidden="true">
            <BookmarkIcon width={22} height={22} />
          </div>
          <div className={styles.featureCardBody}>
            <p className={styles.featureCardTitle}>저장됨</p>
            <p className={styles.featureCardDesc}>
              저장한 콘텐츠를 한곳에 모아봅니다 (준비 중)
            </p>
          </div>
          <div className={styles.featureCardArrow} aria-hidden="true">
            <ChevronRight />
          </div>
        </button>

        <button
          type="button"
          className={`${styles.featureCard} tone-${CARD_TONE.themeToggle}`}
          role="switch"
          aria-checked={theme === 'dark'}
          onClick={toggleTheme}
        >
          <div className={styles.featureCardIconWrap} aria-hidden="true">
            {theme === 'dark' ? (
              <MoonIcon width={22} height={22} />
            ) : (
              <SunIcon width={22} height={22} />
            )}
          </div>
          <div className={styles.featureCardBody}>
            <p className={styles.featureCardTitle}>모드 전환</p>
            <p className={styles.featureCardDesc}>
              화면을 다크/라이트 모드로 전환합니다
            </p>
          </div>
          <span
            className={`${styles.toggle} ${theme === 'dark' ? styles.toggleOn : ''}`}
            aria-hidden="true"
          >
            <span className={styles.toggleKnob} />
          </span>
        </button>

        <button
          type="button"
          className={`${styles.featureCard} tone-${CARD_TONE.report}`}
          onClick={() => placeholder('문제 신고')}
        >
          <div className={styles.featureCardIconWrap} aria-hidden="true">
            <AlertIcon width={22} height={22} />
          </div>
          <div className={styles.featureCardBody}>
            <p className={styles.featureCardTitle}>문제 신고</p>
            <p className={styles.featureCardDesc}>
              이용 중 겪은 문제를 알려주세요 (준비 중)
            </p>
          </div>
          <div className={styles.featureCardArrow} aria-hidden="true">
            <ChevronRight />
          </div>
        </button>
      </div>

      {/* 계정 */}
      <div className={styles.accountSection}>
        <div className={styles.accountSectionHeader}>
          <ShieldIcon width={16} height={16} />
          <span className={styles.accountSectionLabel}>계정</span>
        </div>

        <div className={styles.cardGrid}>
          <button
            type="button"
            className={`${styles.featureCard} tone-${CARD_TONE.password}`}
            onClick={() => navigate('/app/settings/change-password')}
            aria-label="비밀번호 변경 페이지로 이동"
          >
            <div className={styles.featureCardIconWrap} aria-hidden="true">
              <ShieldIcon width={22} height={22} />
            </div>
            <div className={styles.featureCardBody}>
              <p className={styles.featureCardTitle}>비밀번호 변경</p>
              <p className={styles.featureCardDesc}>
                정기적인 비밀번호 변경으로 계정을 안전하게 보호하세요
              </p>
            </div>
            <div className={styles.featureCardArrow} aria-hidden="true">
              <ChevronRight />
            </div>
          </button>

          <button
            type="button"
            className={`${styles.featureCard} tone-${CARD_TONE.logout}`}
            onClick={handleLogout}
          >
            <div className={styles.featureCardIconWrap} aria-hidden="true">
              <LogoutIcon width={22} height={22} />
            </div>
            <div className={styles.featureCardBody}>
              <p className={styles.featureCardTitle}>로그아웃</p>
              <p className={styles.featureCardDesc}>이 기기에서 로그아웃합니다</p>
            </div>
          </button>
        </div>
      </div>

      {/* 위험 구역 */}
      <div className={styles.dangerZone}>
        <div className={styles.dangerZoneHeader}>
          <AlertIcon width={16} height={16} />
          <span className={styles.dangerZoneLabel}>위험 구역</span>
        </div>

        <button
          type="button"
          className={styles.dangerCard}
          onClick={() => navigate('/app/settings/withdraw')}
          aria-label="회원 탈퇴 페이지로 이동"
        >
          <div className={styles.dangerCardIconWrap} aria-hidden="true">
            <AlertIcon width={22} height={22} />
          </div>
          <div className={styles.dangerCardBody}>
            <p className={styles.dangerCardTitle}>회원 탈퇴</p>
            <p className={styles.dangerCardDesc}>
              탈퇴 후 모든 데이터는 복구할 수 없습니다. 신중하게 결정해 주세요
            </p>
          </div>
          <div className={styles.dangerCardArrow} aria-hidden="true">
            <ChevronRight />
          </div>
        </button>
      </div>
    </>
  )
}
