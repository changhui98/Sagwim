import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { deleteMyAccount } from '../api/userApi'
import panelStyles from './SettingsPage.module.css'
import styles from './WithdrawPage.module.css'

const NOTICES = [
  '가입된 모든 모임에서 자동으로 탈퇴돼요. 다시 가입하려면 모임 가입 절차를 처음부터 다시 거쳐야 해요.',
  '내가 작성한 개인 게시글은 모두 삭제돼요. 삭제된 게시글은 복구할 수 없으니 탈퇴 전에 꼭 확인해 주세요.',
  '모임 안에서 작성한 게시글과 다른 회원의 게시글·모임에 남긴 댓글은 삭제되지 않아요. 정리가 필요하면 탈퇴 전에 직접 삭제해 주세요.',
  '탈퇴 신청 후 3일 동안은 삭제 대기 상태로 보관돼요. 이 기간 안에 다시 로그인해서 "계정 복구"를 누르면 그대로 다시 이용할 수 있어요. 3일이 지나면 탈퇴가 확정되어 복구할 수 없어요.',
  '탈퇴가 확정된 후에는 7일 동안 같은 이메일로 다시 가입할 수 없어요.',
] as const

const AGREEMENT_LABEL = '회원 탈퇴 유의사항을 모두 확인하였으며 이에 동의합니다.'

export function WithdrawPage() {
  const navigate = useNavigate()
  const { logout, meNickname, token } = useAuth()

  const [checked, setChecked] = useState<boolean[]>(() => NOTICES.map(() => false))
  const [agreed, setAgreed] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 순차 노출: index N 의 항목은 이전 항목까지 모두 체크돼야 표시.
  // 체크 해제 시 그 이후 항목도 cascade 로 해제하여 동의 체크박스가 남는 일이 없도록 한다.
  const toggleNotice = useCallback((index: number) => {
    setChecked((prev) => {
      const next = [...prev]
      const willBe = !next[index]
      next[index] = willBe
      if (!willBe) {
        for (let i = index + 1; i < next.length; i++) next[i] = false
        setAgreed(false)
      }
      return next
    })
  }, [])

  const allNoticesChecked = useMemo(() => checked.every(Boolean), [checked])
  const canSubmit = allNoticesChecked && agreed && !isSubmitting

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      await deleteMyAccount(token, reason)
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('[WithdrawPage] 회원 탈퇴 오류:', err)
      alert('탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setIsSubmitting(false)
    }
  }, [canSubmit, token, reason, logout, navigate])

  return (
    <>
      <div className={panelStyles.panelHeader}>
        <div className={panelStyles.panelTitleGroup}>
          <button
            type="button"
            className={styles.backLink}
            onClick={() => navigate('/app/settings')}
            aria-label="계정 보안 개요로 돌아가기"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            계정 보안
          </button>
          <h2 className={panelStyles.panelTitle}>회원 탈퇴</h2>
          <p className={panelStyles.panelSubtitle}>
            탈퇴 전 유의사항을 확인하고 신중하게 결정해 주세요
          </p>
        </div>
      </div>

      <div className={panelStyles.formCard}>
        <p className={styles.message}>
          {meNickname ? `${meNickname}님` : ''}
          <br />
          정말 탈퇴하시겠어요?
        </p>

        <ul className={styles.checkList}>
          {NOTICES.map((text, index) => {
            const visible = index === 0 || checked[index - 1]
            if (!visible) return null
            return (
              <li key={index} className={styles.checkItem}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkInput}
                    checked={checked[index]}
                    onChange={() => toggleNotice(index)}
                  />
                  <span className={styles.checkText}>{text}</span>
                </label>
              </li>
            )
          })}

          {allNoticesChecked && (
            <li className={`${styles.checkItem} ${styles.agreementItem}`}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  className={styles.checkInput}
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span className={styles.checkText}>{AGREEMENT_LABEL}</span>
              </label>
            </li>
          )}
        </ul>

        {allNoticesChecked && (
          <section className={styles.reasonSection}>
            <h2 className={styles.reasonLabel}>떠나시는 이유를 알려주세요.</h2>
            <textarea
              className={styles.reasonTextarea}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={'서비스 탈퇴 사유에 대해 알려주세요.\n고객님의 소중한 피드백을 담아\n더 나은 서비스로 보답 드리도록 하겠습니다.'}
              maxLength={500}
            />
          </section>
        )}

        <button
          type="button"
          className={`btn btn-danger btn-lg btn-full ${styles.submitBtn}`}
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
        >
          {isSubmitting ? '탈퇴 처리 중…' : '회원 탈퇴'}
        </button>
      </div>
    </>
  )
}
