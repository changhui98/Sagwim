import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGroup } from '../api/groupApi'
import { uploadGroupImage } from '../api/imageApi'
import { getMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { ImageBoxPicker } from '../components/post/ImageBoxPicker'
import type { GroupCategory, GroupJoinType, GroupMeetingType } from '../types/group'
import type { UserDetailResponse } from '../types/user'
import { GROUP_CATEGORY_LABELS, GROUP_SUB_CATEGORY_MAP } from '../types/group'
import styles from './GroupCreatePage.module.css'

// ── 스텝 인디케이터 (데스크톱) ────────────────────────────────────────────────

const STEP_LABELS = ['이름', '설명', '카테고리', '방식', '마무리'] as const

type StepStatus = 'done' | 'active' | 'pending'

interface StepIndicatorProps {
  visibleStep: number
  completedStep: number
}

function StepIndicator({ visibleStep, completedStep }: StepIndicatorProps) {
  const getStatus = (index: number): StepStatus => {
    const step = index + 1
    if (step <= completedStep) return 'done'
    if (step === visibleStep) return 'active'
    if (step < visibleStep) return 'done'
    return 'pending'
  }

  return (
    <aside className={styles.stepPanel}>
      <ol className={styles.stepList}>
        {STEP_LABELS.map((label, index) => {
          const status = getStatus(index)
          return (
            <li key={label} className={styles.stepItem}>
              <div
                className={`${styles.stepDot} ${styles[`stepDot_${status}`]}`}
                aria-label={`${label} - ${status === 'done' ? '완료' : status === 'active' ? '진행 중' : '대기'}`}
              >
                {status === 'done' && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className={`${styles.stepLabel} ${styles[`stepLabel_${status}`]}`}>
                {label}
              </span>
              {index < STEP_LABELS.length - 1 && (
                <div
                  className={`${styles.stepConnector} ${index + 1 < visibleStep ? styles.stepConnectorDone : ''}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </aside>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────

export function GroupCreatePage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()
  const handleLogout = useLogout()

  // 폼 데이터
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GroupCategory>('SPORTS')
  const [meetingType, setMeetingType] = useState<GroupMeetingType>('OFFLINE')
  const [maxMemberCount, setMaxMemberCount] = useState(10)
  const [images, setImages] = useState<File[]>([])
  const [joinType, setJoinType] = useState<GroupJoinType>('OPEN')
  const [joinQuestions, setJoinQuestions] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Progressive Disclosure 상태 (데스크톱)
  const [visibleStep, setVisibleStep] = useState(1)
  const [completedStep, setCompletedStep] = useState(0)
  const [categorySelected, setCategorySelected] = useState(false)
  const [subCategories, setSubCategories] = useState<string[]>([])

  // 모바일 3단계 폼 상태
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1)
  // 모바일 카테고리 선택 여부
  const [mobileCategorySelected, setMobileCategorySelected] = useState(false)

  // 모바일 대표 사진 (단일 이미지)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Step 2 → Step 3 타이머 ref (데스크톱용)
  const step3TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getMyProfile(token)
      .then(setMyProfile)
      .catch(handleUnauthorized)
  }, [token, handleUnauthorized])

  // 클린업: 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (step3TimerRef.current) clearTimeout(step3TimerRef.current)
    }
  }, [])

  // Step 1 → 2: 이름 1자 이상 입력 시 (데스크톱)
  useEffect(() => {
    if (name.trim().length > 0 && visibleStep < 2) {
      setVisibleStep(2)
    }
  }, [name, visibleStep])

  // Step 3 → 4: 카테고리 선택 시 + Step 4 → 5: meetingType 기본값 OFFLINE이므로 즉시 (데스크톱)
  useEffect(() => {
    if (categorySelected && visibleStep < 4) {
      setVisibleStep(4)
      setCompletedStep((prev) => Math.max(prev, 3))
      setVisibleStep(5)
      setCompletedStep((prev) => Math.max(prev, 4))
    }
  }, [categorySelected, visibleStep])

  // Step 2 나타난 후 설명 textarea blur 또는 2초 후 → Step 3 표시 (데스크톱)
  const handleDescriptionBlur = () => {
    if (visibleStep === 2) {
      revealStep3()
    }
  }

  const revealStep3 = () => {
    if (step3TimerRef.current) {
      clearTimeout(step3TimerRef.current)
      step3TimerRef.current = null
    }
    setVisibleStep((prev) => {
      if (prev < 3) {
        setCompletedStep((c) => Math.max(c, 2))
        return 3
      }
      return prev
    })
  }

  // Step 2가 나타난 시점에 2초 타이머 시작 (데스크톱)
  useEffect(() => {
    if (visibleStep === 2) {
      step3TimerRef.current = setTimeout(() => {
        revealStep3()
      }, 2000)
    }
    if (visibleStep > 2 && step3TimerRef.current) {
      clearTimeout(step3TimerRef.current)
      step3TimerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleStep])

  const handleSubCategoryToggle = (sub: string) => {
    setSubCategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    )
  }

  const handleCategoryChange = (key: GroupCategory) => {
    setCategory(key)
    setSubCategories([])
    if (!categorySelected) {
      setCategorySelected(true)
      setCompletedStep((prev) => Math.max(prev, 3))
    }
  }

  // 모바일 카테고리 변경
  const handleMobileCategoryChange = (key: GroupCategory) => {
    setCategory(key)
    setSubCategories([])
    if (!mobileCategorySelected) {
      setMobileCategorySelected(true)
    }
  }

  // 모바일 대표 사진 선택
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImages([file])
    }
    e.target.value = ''
  }

  const handleCoverImageRemove = () => {
    setImages([])
  }

  // 가입 질문 변경
  const handleJoinQuestionChange = (index: number, value: string) => {
    setJoinQuestions((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleAddJoinQuestion = () => {
    if (joinQuestions.length < 5) {
      setJoinQuestions((prev) => [...prev, ''])
    }
  }

  const handleRemoveJoinQuestion = (index: number) => {
    if (joinQuestions.length > 1) {
      setJoinQuestions((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // 모바일 다음 버튼
  const handleMobileNext = () => {
    if (mobileStep === 1) {
      if (!name.trim()) {
        setErrors((prev) => ({ ...prev, name: '모임 이름은 필수입니다.' }))
        return
      }
      if (name.length > 50) {
        setErrors((prev) => ({ ...prev, name: '모임 이름은 50자를 초과할 수 없습니다.' }))
        return
      }
      setErrors((prev) => ({ ...prev, name: '' }))
      setMobileStep(2)
    } else if (mobileStep === 2) {
      if (!mobileCategorySelected) {
        setErrors((prev) => ({ ...prev, category: '카테고리를 선택해주세요.' }))
        return
      }
      setErrors((prev) => ({ ...prev, category: '' }))
      setMobileStep(3)
    }
  }

  const handleMobileBack = () => {
    if (mobileStep === 2) setMobileStep(1)
    else if (mobileStep === 3) setMobileStep(2)
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = '모임 이름은 필수입니다.'
    else if (name.length > 50) next.name = '모임 이름은 50자를 초과할 수 없습니다.'
    if (description.length > 1000) next.description = '설명은 1000자를 초과할 수 없습니다.'
    if (meetingType === 'OFFLINE' && !myProfile?.address) {
      next.meetingType = '오프라인 모임은 주소 설정이 필요합니다. 프로필 편집에서 주소를 먼저 설정해주세요.'
    }
    if (maxMemberCount < 2) next.maxMemberCount = '최대 인원은 2명 이상이어야 합니다.'
    if (maxMemberCount > 1000) next.maxMemberCount = '최대 인원은 1000명을 초과할 수 없습니다.'
    return next
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      setSubmitting(true)
      if (meetingType === 'OFFLINE' && !myProfile?.address) {
        alert('오프라인 모임을 만들려면 먼저 주소를 설정해야 합니다. 프로필 편집 → 주소에서 설정해주세요.')
        return
      }

      const filteredQuestions =
        joinType === 'APPROVAL_REQUIRED'
          ? joinQuestions.filter((q) => q.trim().length > 0)
          : undefined

      const created = await createGroup(token, {
        name: name.trim(),
        description: description.trim(),
        category,
        subCategories: subCategories.length > 0 ? subCategories : undefined,
        meetingType,
        maxMemberCount,
        joinType,
        joinQuestions: filteredQuestions && filteredQuestions.length > 0 ? filteredQuestions : undefined,
      })
      if (images.length > 0) {
        await Promise.all(images.map((file) => uploadGroupImage(token, file, created.id)))
      }
      navigate(`/app/groups/${created.id}`, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : '모임 생성 실패'
      alert(message)
      handleUnauthorized(err)
    } finally {
      setSubmitting(false)
    }
  }

  // 모바일 Step 3 제출
  const handleMobileSubmit = async () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    // form submit 이벤트 없이 직접 실행
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent
    await handleSubmit(fakeEvent)
  }

  // 커버 이미지 미리보기 URL
  const coverPreviewUrl = images.length > 0 ? URL.createObjectURL(images[0]) : null

  return (
    <>
      <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
      <Header role={myProfile?.role ?? null} onLogout={handleLogout} />

      <main className={styles.main}>
        {/* ── 데스크톱: 뒤로가기 버튼 ── */}
        <button
          type="button"
          className={`${styles.backButton} ${styles.desktopOnlyField}`}
          onClick={() => navigate('/app/groups')}
        >
          &larr; 모임 목록
        </button>

        {/* ── 모바일: 상단 헤더 (뒤로가기 + 단계 표시) ── */}
        <div className={styles.mobileHeader}>
          <button
            type="button"
            className={styles.mobileBackBtn}
            onClick={mobileStep === 1 ? () => navigate('/app/groups') : handleMobileBack}
            aria-label="뒤로가기"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M13 16L7 10L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className={styles.mobileStepIndicator}>
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className={`${styles.mobileStepDot} ${mobileStep === s ? styles.mobileStepDotActive : mobileStep > s ? styles.mobileStepDotDone : ''}`}
              />
            ))}
          </div>
          <span className={styles.mobileStepText}>{mobileStep} / 3</span>
        </div>

        <div className={styles.pageLayout}>
          {/* ── 폼 카드 ── */}
          <div className={styles.card}>
            <h1 className={`${styles.title} ${styles.desktopOnlyField}`}>모임 만들기</h1>

            {/* ── 데스크톱: 오프라인 + 주소 없음 경고 배너 ── */}
            {myProfile && meetingType === 'OFFLINE' && !myProfile.address && visibleStep >= 5 && (
              <div className={`${styles.warningBanner} ${styles.desktopOnlyField}`}>
                <p className={styles.warningText}>
                  오프라인 모임을 만들려면 먼저 주소를 설정해야 합니다.
                  프로필 편집 &rarr; 주소에서 설정해주세요.
                </p>
              </div>
            )}

            {/* ══════════════════════════════════
                모바일 3단계 폼
            ══════════════════════════════════ */}

            {/* ── 모바일 Step 1 ── */}
            <div className={`${styles.mobileOnlyField} ${mobileStep === 1 ? '' : styles.mobileStepHidden}`}>
              <h2 className={styles.mobileStepTitle}>모임을 소개해주세요</h2>

              {/* 모임 이름 */}
              <div className={styles.fieldGroup}>
                <label htmlFor="mobile-name" className={styles.label}>
                  모임 이름 <span className={styles.required}>*</span>
                </label>
                <input
                  id="mobile-name"
                  type="text"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  placeholder="모임 이름을 입력하세요 (최대 50자)"
                  maxLength={50}
                />
                <div className={styles.charCounter}>{name.length} / 50</div>
                {errors.name && <p className={styles.errorText}>{errors.name}</p>}
                <p className={styles.fieldHint}>욕설·혐오·차별·성적 표현 포함 시 등록 제한될 수 있습니다.</p>
              </div>

              {/* 설명 */}
              <div className={styles.fieldGroup}>
                <label htmlFor="mobile-description" className={styles.label}>
                  설명
                  <span className={styles.optionalBadge}>선택</span>
                </label>
                <textarea
                  id="mobile-description"
                  className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }))
                  }}
                  placeholder="모임에 대한 설명을 입력하세요 (최대 1000자)"
                  rows={4}
                  maxLength={1000}
                />
                <div className={styles.charCounter}>{description.length} / 1000</div>
                {errors.description && <p className={styles.errorText}>{errors.description}</p>}
                <p className={styles.fieldHint}>불건전한 내용이 포함될 경우 삭제될 수 있습니다.</p>
              </div>

              {/* 대표 사진 (모바일 전용 단일 이미지 박스) */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  대표 사진
                  <span className={styles.optionalBadge}>선택</span>
                </label>
                <div
                  className={styles.coverImagePicker}
                  onClick={() => !coverPreviewUrl && coverInputRef.current?.click()}
                  role={coverPreviewUrl ? undefined : 'button'}
                  tabIndex={coverPreviewUrl ? undefined : 0}
                  onKeyDown={(e) => {
                    if (!coverPreviewUrl && (e.key === 'Enter' || e.key === ' ')) {
                      coverInputRef.current?.click()
                    }
                  }}
                  aria-label={coverPreviewUrl ? '대표 사진 미리보기' : '대표 사진 선택'}
                >
                  {coverPreviewUrl ? (
                    <>
                      <img src={coverPreviewUrl} alt="대표 사진 미리보기" className={styles.coverImagePreview} />
                      <button
                        type="button"
                        className={styles.coverImageRemoveBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCoverImageRemove()
                        }}
                        aria-label="사진 삭제"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <div className={styles.coverImagePlaceholder}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span>사진 추가</span>
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenFileInput}
                  onChange={handleCoverImageChange}
                />
              </div>
            </div>

            {/* ── 모바일 Step 2 ── */}
            <div className={`${styles.mobileOnlyField} ${mobileStep === 2 ? '' : styles.mobileStepHidden}`}>
              <h2 className={styles.mobileStepTitle}>카테고리를 선택해주세요</h2>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  카테고리 <span className={styles.required}>*</span>
                </label>
                <div className={styles.mobileCategoryGrid}>
                  {(Object.keys(GROUP_CATEGORY_LABELS) as GroupCategory[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`${styles.mobileCategoryBtn} ${category === key && mobileCategorySelected ? styles.mobileCategoryBtnSelected : ''}`}
                      onClick={() => handleMobileCategoryChange(key)}
                      disabled={submitting}
                    >
                      {GROUP_CATEGORY_LABELS[key]}
                    </button>
                  ))}
                </div>
                {errors.category && <p className={styles.errorText}>{errors.category}</p>}
              </div>

              {/* 세부 분류 */}
              {mobileCategorySelected && (
                <div className={`${styles.fieldGroup} ${styles.subCategorySection}`}>
                  <p className={styles.subCategoryLabel}>
                    세부 분야 <span className={styles.optionalBadge}>선택</span>
                  </p>
                  <div className={styles.categoryGrid}>
                    {GROUP_SUB_CATEGORY_MAP[category].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        className={`${styles.categoryPill} ${styles.categoryPillSm} ${subCategories.includes(sub) ? styles.categoryPillSelected : ''}`}
                        onClick={() => handleSubCategoryToggle(sub)}
                        disabled={submitting}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── 모바일 Step 3 ── */}
            <div className={`${styles.mobileOnlyField} ${mobileStep === 3 ? '' : styles.mobileStepHidden}`}>
              <h2 className={styles.mobileStepTitle}>모임 설정을 완료해주세요</h2>

              {/* 모임 방식 */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  모임 방식 <span className={styles.required}>*</span>
                </label>
                <div className={styles.meetingTypeToggle}>
                  {(['OFFLINE', 'ONLINE'] as GroupMeetingType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`${styles.meetingTypeBtn} ${meetingType === type ? styles.meetingTypeBtnActive : ''} ${meetingType === type && type === 'ONLINE' ? styles.meetingTypeBtnOnline : ''}`}
                      onClick={() => {
                        setMeetingType(type)
                        if (errors.meetingType) setErrors((prev) => ({ ...prev, meetingType: '' }))
                      }}
                      disabled={submitting}
                    >
                      {type === 'OFFLINE' ? '오프라인' : '온라인'}
                    </button>
                  ))}
                </div>
                {errors.meetingType && <p className={styles.errorText}>{errors.meetingType}</p>}
              </div>

              {/* 오프라인 + 주소 없음 경고 (모바일) */}
              {myProfile && meetingType === 'OFFLINE' && !myProfile.address && (
                <div className={styles.warningBanner}>
                  <p className={styles.warningText}>
                    오프라인 모임을 만들려면 먼저 주소를 설정해야 합니다.
                    프로필 편집 &rarr; 주소에서 설정해주세요.
                  </p>
                </div>
              )}

              {/* 가입 방법 */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  가입 방법 <span className={styles.required}>*</span>
                </label>
                <div className={styles.meetingTypeToggle}>
                  {(['OPEN', 'APPROVAL_REQUIRED'] as GroupJoinType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`${styles.meetingTypeBtn} ${joinType === type ? styles.meetingTypeBtnActive : ''}`}
                      onClick={() => setJoinType(type)}
                      disabled={submitting}
                    >
                      {type === 'OPEN' ? '자유 가입' : '승인 가입'}
                    </button>
                  ))}
                </div>
                {joinType === 'APPROVAL_REQUIRED' && (
                  <p className={styles.fieldHint}>승인 가입은 리더가 직접 승인 후 가입됩니다.</p>
                )}
              </div>

              {/* 가입 질문 (승인 가입 선택 시) */}
              {joinType === 'APPROVAL_REQUIRED' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>가입 질문</label>
                  {joinQuestions.map((q, index) => (
                    <div key={index} className={styles.joinQuestionRow}>
                      <input
                        type="text"
                        className={styles.input}
                        value={q}
                        onChange={(e) => handleJoinQuestionChange(index, e.target.value)}
                        placeholder={`질문 ${index + 1}`}
                        maxLength={200}
                        disabled={submitting}
                      />
                      {joinQuestions.length > 1 && (
                        <button
                          type="button"
                          className={styles.joinQuestionRemoveBtn}
                          onClick={() => handleRemoveJoinQuestion(index)}
                          disabled={submitting}
                          aria-label={`질문 ${index + 1} 삭제`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {joinQuestions.length < 5 && (
                    <button
                      type="button"
                      className={styles.joinQuestionAddBtn}
                      onClick={handleAddJoinQuestion}
                      disabled={submitting}
                    >
                      + 질문 추가
                    </button>
                  )}
                </div>
              )}

              {/* 최대 인원 */}
              <div className={styles.fieldGroup}>
                <label htmlFor="mobile-maxMemberCount" className={styles.label}>
                  최대 인원 <span className={styles.required}>*</span>
                </label>
                <input
                  id="mobile-maxMemberCount"
                  type="number"
                  className={`${styles.input} ${errors.maxMemberCount ? styles.inputError : ''}`}
                  value={maxMemberCount}
                  onChange={(e) => {
                    setMaxMemberCount(Number(e.target.value))
                    if (errors.maxMemberCount)
                      setErrors((prev) => ({ ...prev, maxMemberCount: '' }))
                  }}
                  min={2}
                  max={1000}
                  disabled={submitting}
                />
                <p className={styles.fieldHint}>최소 2명 이상으로 설정해주세요.</p>
                {errors.maxMemberCount && (
                  <p className={styles.errorText}>{errors.maxMemberCount}</p>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════
                데스크톱 Progressive Disclosure 폼
            ══════════════════════════════════ */}

            <div className={styles.desktopOnlyField}>
            <form onSubmit={handleSubmit} className={styles.form} noValidate>

              {/* Step 1: 모임 이름 */}
              <div className={styles.fieldGroup}>
                <label htmlFor="name" className={styles.label}>
                  모임 이름 <span className={styles.required}>*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  onBlur={() => {
                    if (name.trim().length > 0) {
                      setCompletedStep((prev) => Math.max(prev, 1))
                    }
                  }}
                  placeholder="모임 이름을 입력하세요 (최대 50자)"
                  maxLength={50}
                  autoFocus
                />
                {errors.name && <p className={styles.errorText}>{errors.name}</p>}
              </div>

              {/* Step 2: 설명 */}
              {visibleStep >= 2 && (
                <div className={`${styles.fieldGroup} ${styles.stepReveal}`}>
                  <label htmlFor="description" className={styles.label}>
                    설명
                    <span className={styles.optionalBadge}>선택</span>
                  </label>
                  <textarea
                    id="description"
                    className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      if (errors.description) setErrors((prev) => ({ ...prev, description: '' }))
                    }}
                    onBlur={handleDescriptionBlur}
                    placeholder="모임에 대한 설명을 입력하세요 (최대 1000자)"
                    rows={4}
                    maxLength={1000}
                  />
                  {errors.description && <p className={styles.errorText}>{errors.description}</p>}
                </div>
              )}

              {/* Step 3: 카테고리 */}
              {visibleStep >= 3 && (
                <div className={`${styles.fieldGroup} ${styles.stepReveal}`}>
                  <label className={styles.label}>
                    카테고리 <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.categoryGrid}>
                    {(Object.keys(GROUP_CATEGORY_LABELS) as GroupCategory[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`${styles.categoryPill} ${category === key && categorySelected ? styles.categoryPillSelected : ''}`}
                        onClick={() => handleCategoryChange(key)}
                        disabled={submitting}
                      >
                        {GROUP_CATEGORY_LABELS[key]}
                      </button>
                    ))}
                  </div>

                  {categorySelected && (
                    <div className={`${styles.subCategorySection} ${styles.stepReveal}`}>
                      <p className={styles.subCategoryLabel}>세부 분야 <span className={styles.optionalBadge}>선택</span></p>
                      <div className={styles.categoryGrid}>
                        {GROUP_SUB_CATEGORY_MAP[category].map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            className={`${styles.categoryPill} ${styles.categoryPillSm} ${subCategories.includes(sub) ? styles.categoryPillSelected : ''}`}
                            onClick={() => handleSubCategoryToggle(sub)}
                            disabled={submitting}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {errors.category && <p className={styles.errorText}>{errors.category}</p>}
                </div>
              )}

              {/* Step 4: 모임 방식 */}
              {visibleStep >= 4 && (
                <div className={`${styles.fieldGroup} ${styles.stepReveal}`}>
                  <label className={styles.label}>
                    모임 방식 <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.meetingTypeToggle}>
                    {(['OFFLINE', 'ONLINE'] as GroupMeetingType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`${styles.meetingTypeBtn} ${meetingType === type ? styles.meetingTypeBtnActive : ''} ${meetingType === type && type === 'ONLINE' ? styles.meetingTypeBtnOnline : ''}`}
                        onClick={() => {
                          setMeetingType(type)
                          if (errors.meetingType) setErrors((prev) => ({ ...prev, meetingType: '' }))
                        }}
                        disabled={submitting}
                      >
                        {type === 'OFFLINE' ? '오프라인' : '온라인'}
                      </button>
                    ))}
                  </div>
                  {errors.meetingType && <p className={styles.errorText}>{errors.meetingType}</p>}
                </div>
              )}

              {/* Step 5: 가입 방법 / 지역 / 최대 인원 / 사진 */}
              {visibleStep >= 5 && (
                <div className={`${styles.stepReveal}`}>

                  {/* 가입 방법 */}
                  <div className={`${styles.fieldGroup} ${styles.step5Field}`}>
                    <label className={styles.label}>
                      가입 방법 <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.meetingTypeToggle}>
                      {(['OPEN', 'APPROVAL_REQUIRED'] as GroupJoinType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`${styles.meetingTypeBtn} ${joinType === type ? styles.meetingTypeBtnActive : ''}`}
                          onClick={() => setJoinType(type)}
                          disabled={submitting}
                        >
                          {type === 'OPEN' ? '자유 가입' : '승인 가입'}
                        </button>
                      ))}
                    </div>
                    {joinType === 'APPROVAL_REQUIRED' && (
                      <p className={styles.fieldHint}>승인 가입은 리더가 직접 승인 후 가입됩니다.</p>
                    )}
                  </div>

                  {/* 가입 질문 (승인 가입 선택 시) */}
                  {joinType === 'APPROVAL_REQUIRED' && (
                    <div className={`${styles.fieldGroup} ${styles.step5Field}`}>
                      <label className={styles.label}>가입 질문</label>
                      {joinQuestions.map((q, index) => (
                        <div key={index} className={styles.joinQuestionRow}>
                          <input
                            type="text"
                            className={styles.input}
                            value={q}
                            onChange={(e) => handleJoinQuestionChange(index, e.target.value)}
                            placeholder={`질문 ${index + 1}`}
                            maxLength={200}
                            disabled={submitting}
                          />
                          {joinQuestions.length > 1 && (
                            <button
                              type="button"
                              className={styles.joinQuestionRemoveBtn}
                              onClick={() => handleRemoveJoinQuestion(index)}
                              disabled={submitting}
                              aria-label={`질문 ${index + 1} 삭제`}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      {joinQuestions.length < 5 && (
                        <button
                          type="button"
                          className={styles.joinQuestionAddBtn}
                          onClick={handleAddJoinQuestion}
                          disabled={submitting}
                        >
                          + 질문 추가
                        </button>
                      )}
                    </div>
                  )}

                  {/* 지역 (오프라인일 때) */}
                  {meetingType === 'OFFLINE' && (
                    <div className={`${styles.fieldGroup} ${styles.step5Field}`}>
                      <label className={styles.label}>지역</label>
                      {myProfile?.address ? (
                        <p className={styles.addressText}>
                          {myProfile.address}&nbsp;
                          <span className={styles.addressNote}>(내 주소 자동 적용)</span>
                        </p>
                      ) : (
                        <p className={styles.addressError}>
                          주소를 먼저 설정해야 오프라인 모임을 만들 수 있습니다.
                          <br />프로필 편집 &rarr; 주소에서 설정해주세요.
                        </p>
                      )}
                    </div>
                  )}

                  {/* 최대 인원 */}
                  <div className={`${styles.fieldGroup} ${styles.step5Field}`}>
                    <label htmlFor="maxMemberCount" className={styles.label}>
                      최대 인원 <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="maxMemberCount"
                      type="number"
                      className={`${styles.input} ${errors.maxMemberCount ? styles.inputError : ''}`}
                      value={maxMemberCount}
                      onChange={(e) => {
                        setMaxMemberCount(Number(e.target.value))
                        if (errors.maxMemberCount)
                          setErrors((prev) => ({ ...prev, maxMemberCount: '' }))
                      }}
                      min={2}
                      max={1000}
                    />
                    {errors.maxMemberCount && (
                      <p className={styles.errorText}>{errors.maxMemberCount}</p>
                    )}
                  </div>

                  {/* 사진 */}
                  <div className={`${styles.fieldGroup} ${styles.step5Field}`}>
                    <label className={styles.label}>
                      사진
                      <span className={styles.optionalBadge}>선택</span>
                    </label>
                    <ImageBoxPicker images={images} onChange={setImages} disabled={submitting} />
                  </div>

                  {/* 버튼 행 */}
                  <div className={styles.buttonRow}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => navigate('/app/groups')}
                      disabled={submitting}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={submitting}
                    >
                      {submitting ? '생성 중...' : '모임 만들기'}
                    </button>
                  </div>
                </div>
              )}
            </form>
            </div>
          </div>

          {/* ── 오른쪽: 스텝 인디케이터 (데스크톱) ── */}
          <div className={styles.desktopOnlyField}>
            <StepIndicator visibleStep={visibleStep} completedStep={completedStep} />
          </div>
        </div>

        {/* ── 모바일 하단 고정 버튼 바 ── */}
        <div className={styles.mobileBottomBar}>
          {mobileStep < 3 ? (
            <button
              type="button"
              className={`${styles.mobileNextBtn} ${(mobileStep === 1 && !name.trim()) || (mobileStep === 2 && !mobileCategorySelected) ? styles.mobileNextBtnDisabled : ''}`}
              onClick={handleMobileNext}
              disabled={(mobileStep === 1 && !name.trim()) || (mobileStep === 2 && !mobileCategorySelected)}
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              className={styles.mobileSubmitBtn}
              onClick={handleMobileSubmit}
              disabled={submitting}
            >
              {submitting ? '생성 중...' : '모임 만들기'}
            </button>
          )}
        </div>
      </main>
    </>
  )
}
