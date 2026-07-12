import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MobileHeader } from '../components/MobileHeader'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { getFaqs } from '../api/faqApi'
import type { FaqResponse } from '../types/faq'
import styles from './FaqPage.module.css'

/**
 * 클라이언트 "자주 묻는 질문" 페이지.
 * 관리자가 등록·게시한 FAQ를 아코디언 형태로 노출한다.
 * 비로그인 사용자도 접근 가능하다(공개 API).
 */
export function FaqPage() {
  const { meRole } = useAuth()
  const handleLogout = useLogout()

  const [faqs, setFaqs] = useState<FaqResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    getFaqs()
      .then((data) => {
        if (active) setFaqs(data)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'FAQ를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <Header role={meRole} onLogout={handleLogout} />
      <MobileHeader />

      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>고객지원</p>
          <h1 className={styles.title}>자주 묻는 질문</h1>
          <p className={styles.subtitle}>
            궁금한 점을 모았어요. 원하는 질문을 눌러 답변을 확인해 보세요.
          </p>
        </header>

        {loading ? (
          <div className={styles.center}>
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className={styles.center}>
            <EmptyState title="문제가 발생했어요" description={error} />
          </div>
        ) : faqs.length === 0 ? (
          <div className={styles.center}>
            <EmptyState
              title="등록된 FAQ가 없습니다"
              description="곧 자주 묻는 질문을 채워 넣을게요."
            />
          </div>
        ) : (
          <ul className={styles.list}>
            {faqs.map((faq) => {
              const isOpen = openId === faq.id
              return (
                <li key={faq.id} className={styles.item}>
                  <button
                    type="button"
                    className={styles.question}
                    onClick={() => toggle(faq.id)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.qMark} aria-hidden="true">
                      Q
                    </span>
                    <span className={styles.qText}>{faq.question}</span>
                    <svg
                      className={styles.chevron}
                      data-open={isOpen}
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <div className={isOpen ? styles.answerOpen : styles.answer}>
                    <div className={styles.answerInner}>{faq.answer}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
      <Footer />
    </>
  )
}
