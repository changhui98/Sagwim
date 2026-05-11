import { useNavigate } from 'react-router-dom'
import styles from '../components/profile/ProfileEditModal.module.css'
import pageStyles from './SettingsPage.module.css'

export function SettingsPage() {
  const navigate = useNavigate()

  return (
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
  )
}
