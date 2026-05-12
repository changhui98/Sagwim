import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { Navbar } from '../components/Navbar'
import { deleteMyAccount } from '../api/userApi'
import styles from '../components/profile/ProfileEditModal.module.css'
import pageStyles from './SettingsPage.module.css'
import listStyles from './ProfileEditPage.module.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const { logout, meRole, token } = useAuth()
  useHandleUnauthorized()

  const [isDeleting, setIsDeleting] = useState(false)

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const handleDeleteAccount = useCallback(async () => {
    if (!window.confirm('정말 탈퇴하시겠어요? 계정 정보는 복구할 수 없습니다.')) return
    if (!window.confirm('마지막 확인입니다. 탈퇴를 진행할까요?')) return

    setIsDeleting(true)
    try {
      await deleteMyAccount(token)
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('[SettingsPage] 회원 탈퇴 오류:', err)
      alert('탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsDeleting(false)
    }
  }, [token, logout, navigate])

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

          <div className={pageStyles.body}>
            <ul className={listStyles.settingList}>
              <li
                className={listStyles.settingRow}
                onClick={isDeleting ? undefined : handleDeleteAccount}
                style={isDeleting ? { pointerEvents: 'none', opacity: 0.5 } : undefined}
              >
                <span
                  className={listStyles.settingLabel}
                  style={{ color: 'var(--clr-error)' }}
                >
                  회원 탈퇴
                </span>
                <span className={listStyles.chevron}>›</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </>
  )
}
