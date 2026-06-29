import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getMyProfile, updateMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { AlertDialog } from '../components/common/AlertDialog'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import type { UserDetailResponse } from '../types/user'
import styles from '../components/profile/ProfileEditModal.module.css'
import pageStyles from './ProfileEditPage.module.css'

// ── ScrollPicker ──────────────────────────────────────────────────────────────

interface ScrollPickerProps {
  items: string[]
  selectedIndex: number
  onSelect: (index: number) => void
  itemHeight?: number
  visibleCount?: number
}

function ScrollPicker({
  items,
  selectedIndex,
  onSelect,
  itemHeight = 44,
  visibleCount = 5,
}: ScrollPickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const paddingY = itemHeight * Math.floor(visibleCount / 2)

  // selectedIndex 변경 시 해당 위치로 스크롤
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ top: selectedIndex * itemHeight, behavior: 'smooth' })
  }, [selectedIndex, itemHeight])

  // 마운트 시 초기 위치로 즉시 이동
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ top: selectedIndex * itemHeight, behavior: 'instant' as ScrollBehavior })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = () => {
    const el = ref.current
    if (!el) return
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      const idx = Math.round(el.scrollTop / itemHeight)
      const clamped = Math.max(0, Math.min(idx, items.length - 1))
      onSelect(clamped)
      el.scrollTo({ top: clamped * itemHeight, behavior: 'smooth' })
    }, 80)
  }

  return (
    <div
      ref={ref}
      className={pageStyles.scrollPickerColumn}
      onScroll={handleScroll}
      style={{ paddingTop: paddingY, paddingBottom: paddingY }}
    >
      {items.map((item, idx) => (
        <div
          key={item}
          className={`${pageStyles.scrollPickerItem}${idx === selectedIndex ? ` ${pageStyles.scrollPickerItemSelected}` : ''}`}
          onClick={() => {
            onSelect(idx)
            ref.current?.scrollTo({ top: idx * itemHeight, behavior: 'smooth' })
          }}
        >
          {item}
        </div>
      ))}
    </div>
  )
}

// ── ProfileEditBirthDatePage ──────────────────────────────────────────────────

const ITEM_HEIGHT = 44
const VISIBLE_COUNT = 5
const today = new Date()

const years = Array.from({ length: 101 }, (_, i) => `${today.getFullYear() - i}년`)
const months = Array.from({ length: 12 }, (_, i) => `${i + 1}월`)

function getDaysInMonth(year: number, month: number): number {
  // month는 1-based. new Date(year, month, 0) → month의 마지막 날
  return new Date(year, month, 0).getDate()
}

function parseDateToIndices(dateStr: string): { yearIdx: number; monthIdx: number; dayIdx: number } {
  if (!dateStr) {
    return { yearIdx: 0, monthIdx: 0, dayIdx: 0 }
  }
  const [y, m, d] = dateStr.split('-').map(Number)
  const yearIdx = Math.max(0, today.getFullYear() - y)
  const monthIdx = Math.max(0, Math.min(m - 1, 11))
  const daysInMonth = getDaysInMonth(y, m)
  const dayIdx = Math.max(0, Math.min(d - 1, daysInMonth - 1))
  return { yearIdx, monthIdx, dayIdx }
}

export function ProfileEditBirthDatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/app/profile/edit'
  const { token, setMeProfile } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()
  const handleLogout = useLogout()

  const [profile, setProfile] = useState<UserDetailResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // 피커 인덱스 상태
  const [yearIdx, setYearIdx] = useState(0)
  const [monthIdx, setMonthIdx] = useState(0)
  const [dayIdx, setDayIdx] = useState(0)

  useEffect(() => {
    let cancelled = false
    setProfileLoading(true)
    getMyProfile(token)
      .then((res) => {
        if (cancelled) return
        setProfile(res)
        const { yearIdx: yi, monthIdx: mi, dayIdx: di } = parseDateToIndices(res.birthDate ?? '')
        setYearIdx(yi)
        setMonthIdx(mi)
        setDayIdx(di)
      })
      .catch((err) => {
        if (!cancelled) handleUnauthorized(err)
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, handleUnauthorized])

  // 현재 선택된 연도/월로부터 실제 일수 계산
  const currentYear = today.getFullYear() - yearIdx
  const currentMonth = monthIdx + 1
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}일`)

  // 월이 바뀌어 일수가 줄어들면 dayIdx clamp
  const clampedDayIdx = Math.min(dayIdx, daysInMonth - 1)

  // 월 변경 시 dayIdx 초과 clamp
  useEffect(() => {
    if (dayIdx > daysInMonth - 1) {
      setDayIdx(daysInMonth - 1)
    }
  }, [dayIdx, daysInMonth])

  // 선택된 날짜 문자열
  const selectedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(clampedDayIdx + 1).padStart(2, '0')}`

  const originalDate = profile?.birthDate ?? ''
  const isChanged = profile !== null && selectedDate !== originalDate

  const handleCancel = useCallback(() => {
    if (isChanged && isPickerOpen) {
      setShowConfirm(true)
      return
    }
    navigate(returnTo, { replace: true })
  }, [isChanged, isPickerOpen, navigate, returnTo])

  const handleConfirmDiscard = () => {
    setShowConfirm(false)
    navigate(returnTo, { replace: true })
  }

  const handleSave = useCallback(async () => {
    if (!profile || !isChanged || !isPickerOpen) return
    setIsSaving(true)
    try {
      const updated = await updateMyProfile(token, {
        nickname: profile.nickname,
        address: profile.address ?? '',
        currentPassword: '',
        newPassword: '',
        profileImageUrl: profile.profileImageUrl ?? null,
        bio: profile.bio ?? '',
        gender: profile.gender,
        birthDate: selectedDate || null,
      })
      setMeProfile(updated)
      navigate(returnTo, { replace: true })
    } catch (err) {
      handleUnauthorized(err)
      setAlertMessage('생년월일 저장에 실패했습니다. 다시 시도해주세요.')
      setAlertOpen(true)
    } finally {
      setIsSaving(false)
    }
  }, [navigate, returnTo, profile, isChanged, isPickerOpen, token, selectedDate, setMeProfile, handleUnauthorized])

  if (profileLoading) {
    return (
      <>
        <Navbar role={null} onLogout={handleLogout} />
        <Header role={null} onLogout={handleLogout} />
        <main className={pageStyles.main}>
          <p className={pageStyles.loading}>프로필을 불러오는 중…</p>
        </main>
      </>
    )
  }

  if (!profile) return null

  return (
    <>
      <Navbar role={profile.role ?? null} onLogout={handleLogout} />
      <Header role={profile.role ?? null} onLogout={handleLogout} />

      <main className={pageStyles.main}>
        <div className={pageStyles.container}>
          <header className={styles.header}>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={handleCancel}
              disabled={isSaving}
            >
              돌아가기
            </button>
            <h1 className={styles.title}>생년월일</h1>
            <button
              type="button"
              className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
              onClick={handleSave}
              disabled={!isChanged || !isPickerOpen || isSaving}
            >
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          </header>

          <div style={{ padding: 'var(--sp-5)' }}>
            {/* 날짜 표시 필드 */}
            {originalDate ? (
              /* 이미 설정된 경우 — 변경 불가 */
              <>
                <button
                  type="button"
                  className="input"
                  disabled
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'default',
                    opacity: 1,
                    marginBottom: 'var(--sp-2)',
                  }}
                >
                  {`${currentYear}년 ${currentMonth}월 ${clampedDayIdx + 1}일`}
                </button>
                <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-secondary)', marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
                  생년월일은 한 번 설정하면 변경할 수 없습니다.
                </p>
              </>
            ) : (
              /* 미설정 상태 — 클릭 시 피커 토글 */
              <>
                <button
                  type="button"
                  className="input"
                  onClick={() => setIsPickerOpen((prev) => !prev)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: !isPickerOpen ? 'var(--clr-text-tertiary, var(--clr-text-secondary))' : 'var(--clr-text)',
                    marginBottom: 'var(--sp-2)',
                  }}
                >
                  {!isPickerOpen
                    ? '생년월일을 설정하세요'
                    : `${currentYear}년 ${currentMonth}월 ${clampedDayIdx + 1}일`}
                </button>
                <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-secondary)', marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
                  생년월일은 한 번 설정하면 변경할 수 없으니 신중하게 입력해 주세요.
                </p>
              </>
            )}

            {isPickerOpen && (
              <div
                style={{
                  position: 'relative',
                  height: `${ITEM_HEIGHT * VISIBLE_COUNT}px`,
                  display: 'flex',
                }}
              >
                {/* 중앙 하이라이트 바 */}
                <div
                  style={{
                    position: 'absolute',
                    top: `${ITEM_HEIGHT * Math.floor(VISIBLE_COUNT / 2)}px`,
                    left: 'var(--sp-4)',
                    right: 'var(--sp-4)',
                    height: `${ITEM_HEIGHT}px`,
                    background: 'var(--clr-surface-raised, var(--clr-border))',
                    borderRadius: 'var(--r-md)',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />
                <ScrollPicker
                  items={years}
                  selectedIndex={yearIdx}
                  onSelect={setYearIdx}
                  itemHeight={ITEM_HEIGHT}
                  visibleCount={VISIBLE_COUNT}
                />
                <ScrollPicker
                  items={months}
                  selectedIndex={monthIdx}
                  onSelect={setMonthIdx}
                  itemHeight={ITEM_HEIGHT}
                  visibleCount={VISIBLE_COUNT}
                />
                <ScrollPicker
                  items={days}
                  selectedIndex={clampedDayIdx}
                  onSelect={setDayIdx}
                  itemHeight={ITEM_HEIGHT}
                  visibleCount={VISIBLE_COUNT}
                />
              </div>
            )}
          </div>

        </div>
      </main>

      <AlertDialog
        isOpen={alertOpen}
        variant="error"
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />

      <ConfirmDialog
        isOpen={showConfirm}
        title="변경 취소"
        message="변경 사항이 사라집니다. 계속하시겠습니까?"
        confirmLabel="나가기"
        cancelLabel="계속 편집"
        confirmVariant="danger"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
