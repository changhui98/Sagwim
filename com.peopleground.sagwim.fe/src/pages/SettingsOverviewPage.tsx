import { useNavigate } from 'react-router-dom'
import { ShieldIcon, AlertIcon } from '../components/NavIcons'
import styles from './SettingsPage.module.css'

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

  return (
    <>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <h2 className={styles.panelTitle}>계정 보안</h2>
          <p className={styles.panelSubtitle}>
            비밀번호 변경 및 계정 관련 설정을 관리합니다
          </p>
        </div>
      </div>

      {/* 일반 기능 카드 */}
      <div className={styles.cardGrid}>
        <button
          type="button"
          className={styles.featureCard}
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
