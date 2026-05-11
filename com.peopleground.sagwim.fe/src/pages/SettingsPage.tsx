import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { Navbar } from '../components/Navbar'
import styles from '../components/profile/ProfileEditModal.module.css'
import pageStyles from './SettingsPage.module.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const { logout, meRole } = useAuth()
  useHandleUnauthorized()

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />

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

          <div className={pageStyles.body} />
        </div>
      </main>
    </>
  )
}
