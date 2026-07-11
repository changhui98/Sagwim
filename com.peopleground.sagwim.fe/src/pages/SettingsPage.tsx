import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { MobileHeader } from '../components/MobileHeader'
import { Footer } from '../components/Footer'
import { ShieldIcon, UserCircleIcon, SettingsIcon } from '../components/NavIcons'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { meRole } = useAuth()
  useHandleUnauthorized()
  const handleLogout = useLogout()

  // "프로필 수정" 영역과 "일반" 영역을 구분해 활성 탭을 판정
  const isProfile = pathname.startsWith('/app/settings/profile')
  const isSecurity = pathname.startsWith('/app/settings') && !isProfile

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <Header role={meRole} onLogout={handleLogout} />
      <MobileHeader />

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
              <p className={styles.heroSubtitle}>프로필과 계정 보안을 관리하세요</p>
            </div>
          </div>
        </header>

        {/* ── 본문: 좌측 탭 + 우측 콘텐츠(Outlet) ── */}
        <div className={styles.layout}>
          <nav className={styles.sidebar} aria-label="설정 카테고리">
            <p className={styles.sidebarHeading}>메뉴</p>
            <ul className={styles.tabList} role="tablist">
              <li role="none">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isProfile}
                  className={`${isProfile ? styles.tabItemActive : styles.tabItem} tone-1`}
                  onClick={() => navigate('/app/settings/profile')}
                >
                  <span className={styles.tabIcon} aria-hidden="true">
                    <UserCircleIcon width={18} height={18} />
                  </span>
                  <span className={styles.tabLabel}>프로필 수정</span>
                  {isProfile && <span className={styles.tabActiveIndicator} aria-hidden="true" />}
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSecurity}
                  className={`${isSecurity ? styles.tabItemActive : styles.tabItem} tone-0`}
                  onClick={() => navigate('/app/settings')}
                >
                  <span className={styles.tabIcon} aria-hidden="true">
                    <ShieldIcon width={18} height={18} />
                  </span>
                  <span className={styles.tabLabel}>일반</span>
                  {isSecurity && <span className={styles.tabActiveIndicator} aria-hidden="true" />}
                </button>
              </li>
            </ul>

            <div className={styles.sidebarFooter}>
              <UserCircleIcon width={14} height={14} />
              <span>개인 설정</span>
            </div>
          </nav>

          <div className={styles.content}>
            <Outlet />
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
