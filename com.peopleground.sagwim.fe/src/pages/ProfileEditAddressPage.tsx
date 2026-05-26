import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, searchAddress, updateMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { AlertDialog } from '../components/common/AlertDialog'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import type { UserDetailResponse } from '../types/user'
import styles from '../components/profile/ProfileEditModal.module.css'
import pageStyles from './ProfileEditPage.module.css'

function parseKoreanAddress(addr: string) {
  if (!addr.trim()) return null
  const tokens = addr.trim().split(/\s+/)

  let country = ''
  let city = ''
  let gu = ''
  let dong = ''

  for (const token of tokens) {
    if (token === '대한민국' || token.endsWith('국')) {
      country = token
    } else if (
      token.endsWith('특별시') || token.endsWith('광역시') ||
      token.endsWith('특별자치시') || token.endsWith('특별자치도') ||
      token.endsWith('도') || (token.endsWith('시') && gu === '')
    ) {
      if (city === '') city = token
      else if (gu === '') gu = token
    } else if (token.endsWith('구') || token.endsWith('군')) {
      gu = token
    } else if (
      token.endsWith('동') || token.endsWith('읍') ||
      token.endsWith('면') || token.endsWith('리') ||
      token.endsWith('가')
    ) {
      dong = token
    }
  }

  return { country, city, gu, dong }
}

function isTooDetailedAddress(addr: string): boolean {
  if (!addr.trim()) return false
  const tokens = addr.trim().split(/\s+/)
  // 동/읍/면/리/가 이후 토큰이 존재하면 상세주소로 판단
  let foundDong = false
  for (const token of tokens) {
    if (foundDong) return true  // 동 이후 토큰이 있으면 too detailed
    if (
      token.endsWith('동') || token.endsWith('읍') ||
      token.endsWith('면') || token.endsWith('리') ||
      token.endsWith('가')
    ) {
      foundDong = true
    }
  }
  // 숫자가 포함된 토큰이 있으면 상세주소 (번지, 호수 등)
  return tokens.some(t => /\d/.test(t))
}

export function ProfileEditAddressPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()
  const handleLogout = useLogout()

  const [profile, setProfile] = useState<UserDetailResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const [address, setAddress] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isUserTyping, setIsUserTyping] = useState(false)

  const [exposureRange, setExposureRange] = useState('1')

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertVariant, setAlertVariant] = useState<'success' | 'error'>('success')
  const [alertMessage, setAlertMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    setProfileLoading(true)
    getMyProfile(token)
      .then((res) => {
        if (cancelled) return
        setProfile(res)
        setAddress(res.address ?? '')
        setExposureRange(String(res.exposureRangeKm ?? 1))
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

  useEffect(() => {
    if (!isUserTyping || address.trim().length < 2) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      const results = await searchAddress(token, address.trim())
      setSuggestions(results)
      setIsSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [address, token, isUserTyping])

  const isTooDetailed = isTooDetailedAddress(address)

  const isAddressChanged = profile !== null && address.trim() !== (profile.address ?? '').trim()
  const savedExposureRange = String(profile?.exposureRangeKm ?? 1)
  const isExposureRangeChanged = profile !== null && exposureRange !== savedExposureRange
  const hasChanges = (isAddressChanged && address.trim().length > 0 && !isTooDetailed) || isExposureRangeChanged

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      setShowConfirm(true)
      return
    }
    navigate('/app/profile/edit', { replace: true })
  }, [hasChanges, navigate])

  const handleConfirmDiscard = () => {
    setShowConfirm(false)
    navigate('/app/profile/edit', { replace: true })
  }

  const handleSave = useCallback(async () => {
    if (!profile || !hasChanges) return
    setIsSaving(true)
    try {
      await updateMyProfile(token, {
        nickname: profile.nickname,
        address: address.trim(),
        currentPassword: '',
        newPassword: '',
        profileImageUrl: profile.profileImageUrl ?? null,
        bio: profile.bio ?? '',
        gender: profile.gender,
        birthDate: profile.birthDate ?? null,
        isSearchable: profile.isSearchable,
        exposureRangeKm: Number(exposureRange),
      })
      navigate('/app/profile/edit', { replace: true })
    } catch (err) {
      handleUnauthorized(err)
      setAlertVariant('error')
      setAlertMessage('주소 저장에 실패했습니다. 다시 시도해주세요.')
      setAlertOpen(true)
    } finally {
      setIsSaving(false)
    }
  }, [navigate, hasChanges, address, profile, token, handleUnauthorized, exposureRange])

  if (profileLoading) {
    return (
      <>
        <Navbar role={null} onLogout={handleLogout} />
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
            <h1 className={styles.title}>주소</h1>
            <button
              type="button"
              className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          </header>

          <div className="input-group" style={{ padding: 'var(--sp-5)' }}>
            <label className="input-label" htmlFor="address-input">
              주소
            </label>
            <div style={{ marginTop: 'var(--sp-3)' }}>
              <input
                id="address-input"
                type="text"
                className="input"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setIsUserTyping(true) }}
                placeholder="동명(읍, 면)으로 검색 (ex. 서초동)"
                disabled={isSaving}
                autoComplete="off"
                style={isTooDetailed ? { border: '1px solid #ef4444' } : undefined}
              />
              {isSearching && (
                <p style={{ marginTop: 'var(--sp-2)', fontSize: '0.875rem', color: 'var(--clr-text-secondary)' }}>
                  검색 중...
                </p>
              )}
              {!isSearching && suggestions.length > 0 && (
                <ul style={{
                  border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--r-md)',
                  marginTop: 'var(--sp-1)',
                  overflow: 'hidden',
                  background: 'var(--clr-surface)',
                  listStyle: 'none',
                  padding: 0,
                  margin: 'var(--sp-1) 0 0 0',
                }}>
                  {suggestions.map((s) => (
                    <li
                      key={s}
                      onClick={() => {
                        setAddress(s)
                        setSuggestions([])
                        setIsUserTyping(false)
                      }}
                      style={{
                        padding: 'var(--sp-3) var(--sp-4)',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--clr-border)',
                        fontSize: '0.9375rem',
                        color: s === address ? 'var(--clr-primary)' : 'var(--clr-text)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      {s}
                      {s === address && <span>✓</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p style={{ marginTop: 'var(--sp-3)', fontSize: '0.875rem', color: 'var(--clr-text-secondary)' }}>
              주소는 모임 추천 등에 활용됩니다.
            </p>
            <p style={{
              marginTop: 'var(--sp-1)',
              fontSize: '0.875rem',
              color: isTooDetailed ? '#ef4444' : 'var(--clr-text-secondary)',
            }}>
              동·읍·면 단위까지만 입력해 주세요.
            </p>
            {(() => {
              const parsed = parseKoreanAddress(address)
              if (!parsed || (!parsed.country && !parsed.city && !parsed.gu && !parsed.dong)) return null
              return (
                <ul className={pageStyles.settingList} style={{ marginTop: 'var(--sp-4)' }}>
                  {parsed.country && (
                    <li className={pageStyles.settingRow} style={{ cursor: 'default' }}>
                      <span className={pageStyles.settingLabel}>나라</span>
                      <span className={pageStyles.settingValue}>{parsed.country}</span>
                    </li>
                  )}
                  {parsed.city && (
                    <li className={pageStyles.settingRow} style={{ cursor: 'default' }}>
                      <span className={pageStyles.settingLabel}>시 · 도</span>
                      <span className={pageStyles.settingValue}>{parsed.city}</span>
                    </li>
                  )}
                  {parsed.gu && (
                    <li className={pageStyles.settingRow} style={{ cursor: 'default' }}>
                      <span className={pageStyles.settingLabel}>구 · 군</span>
                      <span className={pageStyles.settingValue}>{parsed.gu}</span>
                    </li>
                  )}
                  {parsed.dong && (
                    <li className={pageStyles.settingRow} style={{ cursor: 'default' }}>
                      <span className={pageStyles.settingLabel}>동 · 읍 · 면</span>
                      <span className={pageStyles.settingValue}>{parsed.dong}</span>
                    </li>
                  )}
                </ul>
              )
            })()}

            <p className="input-label" style={{ marginTop: 'var(--sp-8)', marginBottom: 'var(--sp-5)' }}>설정</p>

            <div className={pageStyles.rangeSection}>
              <p className={pageStyles.rangeSectionTitle}>모임 노출 범위 (km)</p>
              <div className={pageStyles.rangeTrack}>
                {[1, 2, 3, 4, 5].map((n, i) => {
                  const active = Number(exposureRange) >= n
                  const isLast = i === 4
                  return (
                    <React.Fragment key={n}>
                      <div
                        className={pageStyles.rangeStepWrapper}
                        onClick={() => setExposureRange(String(n))}
                      >
                        <div
                          className={`${pageStyles.rangeCircle} ${active ? pageStyles.rangeCircleActive : ''}`}
                        />
                        <span
                          className={`${pageStyles.rangeLabel} ${active ? pageStyles.rangeLabelActive : ''}`}
                        >
                          {n}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          className={`${pageStyles.rangeLine} ${Number(exposureRange) > n ? pageStyles.rangeLineActive : ''}`}
                        />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
              <p style={{ marginTop: 'var(--sp-3)', fontSize: '0.875rem', color: 'var(--clr-text-secondary)' }}>
                설정한 반경 내의 모임이 추천됩니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog
        isOpen={alertOpen}
        variant={alertVariant}
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
