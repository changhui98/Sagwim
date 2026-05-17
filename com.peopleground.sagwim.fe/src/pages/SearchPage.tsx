import { useNavigate } from 'react-router-dom'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { SearchContent } from '../components/search/SearchContent'
import styles from './SearchPage.module.css'

export function SearchPage() {
  const navigate = useNavigate()
  useHandleUnauthorized()

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.pageHeader}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
            >
              <BackIcon />
            </button>
            <h1 className={styles.title}>검색</h1>
            <span className={styles.headerSpacer} />
          </header>

          <div className={styles.contentWrap}>
            <SearchContent onClose={() => navigate(-1)} />
          </div>
        </div>
      </main>
    </>
  )
}

function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
