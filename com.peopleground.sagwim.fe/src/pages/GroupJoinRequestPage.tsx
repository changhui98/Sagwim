import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getGroup, joinGroup } from '../api/groupApi'
import { getMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { extractErrorMessage } from '../utils/errorUtils'
import { Navbar } from '../components/Navbar'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import type { GroupDetailResponse } from '../types/group'
import type { UserDetailResponse } from '../types/user'
import modalStyles from '../components/profile/ProfileEditModal.module.css'
import pageStyles from './ProfileEditPage.module.css'

export function GroupJoinRequestPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const loadData = useCallback(async () => {
    if (!groupId) return
    try {
      setLoading(true)
      const [groupData, profileData] = await Promise.all([
        getGroup(token, Number(groupId)),
        getMyProfile(token),
      ])
      setGroup(groupData)
      setMyProfile(profileData)
      const questions = groupData.joinQuestions ?? []
      setAnswers(Array(questions.length).fill(''))
    } catch (err) {
      handleUnauthorized(err)
    } finally {
      setLoading(false)
    }
  }, [token, groupId, handleUnauthorized])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)))
  }

  const handleSubmit = async () => {
    if (!groupId || !group) return
    const questions = group.joinQuestions ?? []
    const serializedAnswer =
      questions.length > 0 ? JSON.stringify(answers) : undefined
    try {
      setSubmitting(true)
      setError('')
      await joinGroup(token, Number(groupId), serializedAnswer)
      navigate(`/app/groups/${groupId}`, { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, '가입 신청에 실패했습니다.'))
      handleUnauthorized(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={pageStyles.main}>
          <LoadingSpinner />
        </main>
      </>
    )
  }

  const questions = group?.joinQuestions ?? []

  return (
    <>
      <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />

      <main className={pageStyles.main}>
        <div className={pageStyles.container}>
          <header className={modalStyles.header}>
            <button
              type="button"
              className={modalStyles.headerBtn}
              onClick={() => navigate(`/app/groups/${groupId}`)}
            >
              돌아가기
            </button>
            <h1 className={modalStyles.title}>가입 신청</h1>
            <span style={{ minWidth: '4rem' }} />
          </header>

          {questions.length > 0 ? (
            <>
              {questions.map((question, i) => (
                <div key={i}>
                  <div style={{ padding: 'var(--sp-5) var(--sp-5) 0' }}>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: 'var(--clr-text)',
                        margin: '0 0 var(--sp-3) 0',
                      }}
                    >
                      Q{i + 1}. {question}
                    </p>
                    <textarea
                      className="input"
                      placeholder="답변을 입력하세요 (최대 500자)"
                      maxLength={500}
                      rows={4}
                      value={answers[i] ?? ''}
                      onChange={(e) => handleAnswerChange(i, e.target.value)}
                      disabled={submitting}
                    />
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--clr-text-muted)',
                        textAlign: 'right',
                        margin: 'var(--sp-1) 0 0',
                      }}
                    >
                      {(answers[i] ?? '').length} / 500
                    </p>
                  </div>
                  {i < questions.length - 1 && (
                    <hr
                      style={{
                        margin: 'var(--sp-4) 0',
                        border: 'none',
                        borderTop: '1px solid var(--clr-border)',
                      }}
                    />
                  )}
                </div>
              ))}
            </>
          ) : null}

          <div style={{ padding: 'var(--sp-5)' }}>
            {error && (
              <p
                style={{
                  color: 'var(--clr-danger)',
                  fontSize: '0.875rem',
                  marginBottom: 'var(--sp-3)',
                }}
              >
                {error}
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '처리 중...' : '가입 신청'}
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
