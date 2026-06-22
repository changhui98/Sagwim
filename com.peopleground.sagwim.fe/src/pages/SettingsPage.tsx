import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { MobileHeader } from '../components/MobileHeader'
import { Footer } from '../components/Footer'
import { ShieldIcon, UserCircleIcon, AlertIcon, SettingsIcon } from '../components/NavIcons'
import styles from './SettingsPage.module.css'

type TabId = 'account'

interface SideTab {
  id: TabId
  label: string
  icon: ReactNode
}

const TABS: SideTab[] = [
  {
    id: 'account',
    label: '계정 보안',
    icon: <ShieldIcon width={18} height={18} />,
  },
]

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

export function SettingsPage() {
  const navigate = useNavigate()
  const { meRole } = useAuth()
  useHandleUnauthorized()
  const handleLogout = useLogout()

  const [activeTab, setActiveTab] = useState<TabId>('account')

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <Header role={meRole} onLogout={handleLogout} />
      <MobileHeader onLogout={handleLogout} />

      <main className={styles.main}>
        {/* ── 히어로 배너 ── */}
        <header className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroIconWrap} aria-hidden="true">
              <SettingsIcon width={28} height={28} />
            </div>
            <div>
              <p className={styles.heroEyebrow}>내 계정</p>
              <h1 className={styles.heroTitle}>설정</h1>
              <p className={styles.heroSubtitle}>계정과 보안을 관리하세요</p>
            </div>
          </div>
        </header>

        {/* ── 본문: 좌측 탭 + 우측 콘텐츠 ── */}
        <div className={styles.layout}>
          {/* 좌측 세로 탭 네비게이션 */}
          <nav className={styles.sidebar} aria-label="설정 카테고리">
            <p className={styles.sidebarHeading}>메뉴</p>
            <ul className={styles.tabList} role="tablist">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <li key={tab.id} role="none">
                    <button
                      type="button"
                      id={`tab-${tab.id}`}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`panel-${tab.id}`}
                      className={isActive ? styles.tabItemActive : styles.tabItem}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span className={styles.tabIcon} aria-hidden="true">
                        {tab.icon}
                      </span>
                      <span className={styles.tabLabel}>{tab.label}</span>
                      {isActive && (
                        <span className={styles.tabActiveIndicator} aria-hidden="true" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className={styles.sidebarFooter}>
              <UserCircleIcon width={14} height={14} />
              <span>개인 설정</span>
            </div>
          </nav>

          {/* 우측 콘텐츠 패널 */}
          <div
            id="panel-account"
            role="tabpanel"
            aria-labelledby="tab-account"
            className={styles.content}
          >
            <div className={styles.panelHeader}>
              <div className={styles.panelTitleGroup}>
                <h2 className={styles.panelTitle}>계정 보안</h2>
                <p className={styles.panelSubtitle}>
                  비밀번호 변경 및 계정 관련 설정을 관리합니다
                </p>
              </div>
            </div>

            {/* 기능 카드 그리드 */}
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

            {/* 위험 구역 섹션 */}
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
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
