import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import styles from '../components/profile/ProfileEditModal.module.css'
import pageStyles from './SettingsPage.module.css'
import listStyles from './ProfileEditPage.module.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const { meRole } = useAuth()
  useHandleUnauthorized()
  const handleLogout = useLogout()

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <Header role={meRole} onLogout={handleLogout} />

      <main className={pageStyles.main}>
        <div className={pageStyles.container}>
          <header className={styles.header}>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={() => navigate(-1)}
            >
              돌아가기
            </button>
            <h1 className={styles.title}>설정</h1>
            <span style={{ minWidth: '4rem' }} />
          </header>

          <div className={pageStyles.body}>
            <ul className={listStyles.settingList}>
              <li
                className={listStyles.settingRow}
                onClick={() => navigate('/app/settings/change-password')}
              >
                <span className={listStyles.settingLabel}>비밀번호 변경</span>
                <span className={listStyles.chevron} style={{ marginLeft: 'auto' }}>›</span>
              </li>
              <li
                className={listStyles.settingRow}
                onClick={() => navigate('/app/settings/withdraw')}
              >
                <span
                  className={listStyles.settingLabel}
                  style={{ color: 'var(--clr-error)' }}
                >
                  회원 탈퇴
                </span>
                <span className={listStyles.chevron} style={{ marginLeft: 'auto' }}>›</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </>
  )
}
