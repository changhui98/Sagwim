import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getGroup,
  updateGroup,
  deleteGroup,
  getPendingJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  updateGroupJoinType,
  getGroupJoinQuestions,
  updateGroupJoinQuestions,
} from '../api/groupApi'
import { uploadGroupImage } from '../api/imageApi'
import { getMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { extractErrorMessage } from '../utils/errorUtils'
import { Navbar } from '../components/Navbar'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import type { GroupDetailResponse, GroupJoinRequestResponse, GroupJoinType } from '../types/group'
import type { UserDetailResponse } from '../types/user'
import modalStyles from '../components/profile/ProfileEditModal.module.css'
import profileStyles from './ProfileEditPage.module.css'
import groupPageStyles from './GroupDetailPage.module.css'
import tabStyles from '../components/group/TabSettings.module.css'
import tableStyles from '../components/admin/adminTable.module.css'
import styles from './GroupSettingsPage.module.css'

type SubView = 'menu' | 'info' | 'description' | 'memberCount' | 'joinRequests' | 'joinType'

export function GroupSettingsPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [groupImageUrl, setGroupImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imgError, setImgError] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [view, setView] = useState<SubView>('menu')

  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editMaxMemberCount, setEditMaxMemberCount] = useState(0)

  const [joinRequests, setJoinRequests] = useState<GroupJoinRequestResponse[]>([])
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false)
  const [joinRequestError, setJoinRequestError] = useState('')
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null)

  const [joinTypeLoading, setJoinTypeLoading] = useState(false)
  const [joinTypeError, setJoinTypeError] = useState('')
  const [editJoinType, setEditJoinType] = useState<GroupJoinType>('OPEN')
  const [editJoinQuestions, setEditJoinQuestions] = useState<string[]>([''])

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const loadData = useCallback(async () => {
    if (!groupId) return
    try {
      setLoading(true)
      setError('')
      const [groupData, profileData] = await Promise.all([
        getGroup(token, Number(groupId)),
        getMyProfile(token),
      ])
      setGroup(groupData)
      setMyProfile(profileData)
      setEditName(groupData.name)
      setEditDescription(groupData.description ?? '')
      setEditMaxMemberCount(groupData.maxMemberCount)
      setGroupImageUrl(groupData.imageUrl ?? null)
      setEditJoinType(groupData.joinType)
    } catch (err) {
      setError(extractErrorMessage(err, '모임 정보 조회 실패'))
      handleUnauthorized(err)
    } finally {
      setLoading(false)
    }
  }, [token, groupId, handleUnauthorized])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadJoinRequests = useCallback(async () => {
    if (!groupId || !group) return
    try {
      setJoinRequestsLoading(true)
      setJoinRequestError('')
      const data = await getPendingJoinRequests(token, group.id)
      setJoinRequests(data)
    } catch {
      setJoinRequestError('가입 신청 목록을 불러오지 못했습니다.')
    } finally {
      setJoinRequestsLoading(false)
    }
  }, [token, groupId, group])

  useEffect(() => {
    if (view === 'joinRequests') loadJoinRequests()
  }, [view, loadJoinRequests])

  useEffect(() => {
    if (view !== 'joinType' || !group) return
    getGroupJoinQuestions(token, group.id)
      .then((data) => setEditJoinQuestions(data.length > 0 ? data : ['']))
      .catch(() => setEditJoinQuestions(
        group.joinQuestions && group.joinQuestions.length > 0 ? group.joinQuestions : ['']
      ))
  }, [view, group, token])

  const handleBackToMenu = () => {
    setView('menu')
    setJoinRequestError('')
    setJoinTypeError('')
  }

  const handleSaveInfo = async () => {
    if (!groupId || !group) return
    try {
      setActionLoading(true)
      await updateGroup(token, Number(groupId), {
        name: editName,
        description: group.description ?? '',
        category: group.category,
        meetingType: group.meetingType,
        maxMemberCount: group.maxMemberCount,
      })
      setGroup((prev) => prev ? { ...prev, name: editName } : prev)
      handleBackToMenu()
    } catch (err) {
      alert(extractErrorMessage(err, '모임 수정 실패'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveDescription = async () => {
    if (!groupId || !group) return
    try {
      setActionLoading(true)
      await updateGroup(token, Number(groupId), {
        name: group.name,
        description: editDescription,
        category: group.category,
        meetingType: group.meetingType,
        maxMemberCount: group.maxMemberCount,
      })
      setGroup((prev) => prev ? { ...prev, description: editDescription } : prev)
      handleBackToMenu()
    } catch (err) {
      alert(extractErrorMessage(err, '모임 수정 실패'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveMemberCount = async () => {
    if (!groupId || !group) return
    try {
      setActionLoading(true)
      await updateGroup(token, Number(groupId), {
        name: group.name,
        description: group.description ?? '',
        category: group.category,
        meetingType: group.meetingType,
        maxMemberCount: editMaxMemberCount,
      })
      setGroup((prev) => prev ? { ...prev, maxMemberCount: editMaxMemberCount } : prev)
      handleBackToMenu()
    } catch (err) {
      alert(extractErrorMessage(err, '인원 수정 실패'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveJoinType = async () => {
    if (!group) return
    try {
      setJoinTypeLoading(true)
      setJoinTypeError('')
      await updateGroupJoinType(token, group.id, group, editJoinType)
      const filteredQuestions = editJoinQuestions.filter((q) => q.trim())
      await updateGroupJoinQuestions(token, group.id, filteredQuestions)
      setGroup((prev) =>
        prev
          ? { ...prev, joinType: editJoinType, joinQuestions: filteredQuestions }
          : prev,
      )
      handleBackToMenu()
    } catch {
      setJoinTypeError('가입 방식 변경에 실패했습니다.')
    } finally {
      setJoinTypeLoading(false)
    }
  }

  const handleBackFromInfo = async () => {
    if (editName.trim() !== (group?.name ?? '').trim()) {
      await handleSaveInfo()
    } else {
      handleBackToMenu()
    }
  }

  const handleBackFromDescription = async () => {
    if (editDescription.trim() !== (group?.description ?? '').trim()) {
      await handleSaveDescription()
    } else {
      handleBackToMenu()
    }
  }

  const handleBackFromMemberCount = async () => {
    if (editMaxMemberCount !== group?.maxMemberCount) {
      await handleSaveMemberCount()
    } else {
      handleBackToMenu()
    }
  }

  const handleBackFromJoinType = async () => {
    const joinTypeChanged = editJoinType !== group?.joinType
    const joinQuestionsChanged =
      editJoinQuestions.join('|') !== (group?.joinQuestions ?? []).join('|')
    if (joinTypeChanged || joinQuestionsChanged) {
      await handleSaveJoinType()
    } else {
      handleBackToMenu()
    }
  }

  const handleDeleteGroup = async () => {
    if (!groupId) return
    if (!window.confirm('모임을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    try {
      setActionLoading(true)
      await deleteGroup(token, Number(groupId))
      navigate('/app/groups', { replace: true })
    } catch (err) {
      alert(extractErrorMessage(err, '모임 삭제 실패'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async (requestId: number) => {
    if (!group) return
    try {
      setJoinRequestError('')
      await approveJoinRequest(token, group.id, requestId)
      setJoinRequests((prev) => prev.filter((r) => r.requestId !== requestId))
    } catch {
      setJoinRequestError('승인 처리에 실패했습니다.')
    }
  }

  const handleReject = async (requestId: number) => {
    if (!group) return
    try {
      setJoinRequestError('')
      await rejectJoinRequest(token, group.id, requestId)
      setJoinRequests((prev) => prev.filter((r) => r.requestId !== requestId))
    } catch {
      setJoinRequestError('거절 처리에 실패했습니다.')
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !group) return

    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    setImgError(false)

    try {
      setImageUploading(true)
      await uploadGroupImage(token, file, group.id)
      setGroupImageUrl(objectUrl)
    } catch (err) {
      alert(extractErrorMessage(err, '이미지 업로드에 실패했습니다.'))
      setImagePreview(null)
    } finally {
      setImageUploading(false)
    }
  }

  const currentImageSrc = imagePreview ?? groupImageUrl

  const isLeader = myProfile?.username === group?.leaderUsername

  const handleBack = () => {
    navigate(`/app/groups/${groupId}`)
  }

  if (loading) {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={styles.loadingWrapper}>
            <LoadingSpinner />
          </div>
        </main>
      </>
    )
  }

  if (error || !group) {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <p style={{ color: 'var(--clr-error)' }}>{error || '모임을 찾을 수 없습니다.'}</p>
        </main>
      </>
    )
  }

  if (!isLeader) {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <p style={{ color: 'var(--clr-error)' }}>설정 페이지에 접근 권한이 없습니다.</p>
        </main>
      </>
    )
  }

  // ── 서브 뷰: 모임 이름 변경 ──
  if (view === 'info') {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={profileStyles.container}>
            <header className={modalStyles.header}>
              <button
                type="button"
                className={modalStyles.headerBtn}
                onClick={handleBackFromInfo}
                disabled={actionLoading}
              >
                {actionLoading ? '저장 중...' : '돌아가기'}
              </button>
              <h2 className={modalStyles.title}>모임 이름</h2>
              <span style={{ minWidth: '4rem' }} />
            </header>
            <div className="input-group" style={{ padding: 'var(--sp-5)' }}>
              <label className="input-label" htmlFor="group-name-input">
                모임 이름
              </label>
              <input
                id="group-name-input"
                type="text"
                className="input"
                placeholder="모임 이름 (최대 50자)"
                maxLength={50}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={actionLoading}
              />
            </div>
          </div>
        </main>
      </>
    )
  }

  // ── 서브 뷰: 모임 소개 변경 ──
  if (view === 'description') {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={profileStyles.container}>
            <header className={modalStyles.header}>
              <button
                type="button"
                className={modalStyles.headerBtn}
                onClick={handleBackFromDescription}
                disabled={actionLoading}
              >
                {actionLoading ? '저장 중...' : '돌아가기'}
              </button>
              <h2 className={modalStyles.title}>모임 소개</h2>
              <span style={{ minWidth: '4rem' }} />
            </header>
            <div className="input-group" style={{ padding: 'var(--sp-5)' }}>
              <label className="input-label" htmlFor="group-description-input">
                모임 소개
              </label>
              <textarea
                id="group-description-input"
                className="input"
                placeholder="모임 소개 (최대 1000자)"
                maxLength={1000}
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={actionLoading}
              />
            </div>
          </div>
        </main>
      </>
    )
  }

  // ── 서브 뷰: 모임 인원 변경 ──
  if (view === 'memberCount') {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={profileStyles.container}>
            <header className={modalStyles.header}>
              <button
                type="button"
                className={modalStyles.headerBtn}
                onClick={handleBackFromMemberCount}
                disabled={actionLoading}
              >
                {actionLoading ? '저장 중...' : '돌아가기'}
              </button>
              <h2 className={modalStyles.title}>모임 인원 변경</h2>
              <span style={{ minWidth: '4rem' }} />
            </header>
            <div className={tabStyles.subForm} style={{ padding: 'var(--sp-5)' }}>
              <input
                type="number"
                className={groupPageStyles.editInput}
                min={2}
                max={1000}
                value={editMaxMemberCount}
                onChange={(e) => setEditMaxMemberCount(Number(e.target.value))}
                disabled={actionLoading}
              />
            </div>
          </div>
        </main>
      </>
    )
  }

  // ── 서브 뷰: 가입 방식 선택 ──
  if (view === 'joinType') {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={profileStyles.container}>
            <header className={modalStyles.header}>
              <button
                type="button"
                className={modalStyles.headerBtn}
                onClick={handleBackFromJoinType}
                disabled={joinTypeLoading}
              >
                {joinTypeLoading ? '저장 중...' : '돌아가기'}
              </button>
              <h2 className={modalStyles.title}>가입 방식</h2>
              <span style={{ minWidth: '4rem' }} />
            </header>
            <ul className={profileStyles.settingList}>
              <li
                className={profileStyles.settingRow}
                onClick={() => setEditJoinType('OPEN')}
                style={{ cursor: 'pointer' }}
              >
                <span className={profileStyles.settingLabel}>자유</span>
                <span className={profileStyles.settingValue}>
                  {editJoinType === 'OPEN' ? '✓' : ''}
                </span>
              </li>
              <li
                className={profileStyles.settingRow}
                onClick={() => setEditJoinType('APPROVAL_REQUIRED')}
                style={{ cursor: 'pointer' }}
              >
                <span className={profileStyles.settingLabel}>승인</span>
                <span className={profileStyles.settingValue}>
                  {editJoinType === 'APPROVAL_REQUIRED' ? '✓' : ''}
                </span>
              </li>
              {editJoinType === 'APPROVAL_REQUIRED' && (
                <li className={profileStyles.settingRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--sp-3)', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <label className="input-label" style={{ margin: 0, flex: 1 }}>
                      가입 질문 <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontWeight: 400 }}>(최대 5개)</span>
                    </label>
                    {editJoinQuestions.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setEditJoinQuestions((prev) => [...prev, ''])}
                        style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--clr-primary)', padding: '0 var(--sp-1)' }}
                        disabled={joinTypeLoading}
                      >
                        +
                      </button>
                    )}
                  </div>
                  {editJoinQuestions.map((q, idx) => (
                    <div key={idx} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                      <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'flex-start' }}>
                        <textarea
                          className="input"
                          placeholder="가입 신청자에게 물어볼 질문을 입력하세요"
                          maxLength={500}
                          rows={3}
                          value={q}
                          onChange={(e) => setEditJoinQuestions((prev) => prev.map((v, i) => i === idx ? e.target.value : v))}
                          disabled={joinTypeLoading}
                          style={{ flex: 1 }}
                        />
                        {editJoinQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEditJoinQuestions((prev) => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--clr-text-muted)', paddingTop: '8px' }}
                            disabled={joinTypeLoading}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--clr-text-muted)', textAlign: 'right', margin: 0 }}>
                        {q.length} / 500
                      </p>
                    </div>
                  ))}
                </li>
              )}
            </ul>
            {joinTypeError && <p className={tabStyles.errorText} style={{ padding: '0 var(--sp-5)' }}>{joinTypeError}</p>}
          </div>
        </main>
      </>
    )
  }

  // ── 서브 뷰: 가입 신청 인원 ──
  if (view === 'joinRequests') {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={profileStyles.container}>
            <header className={modalStyles.header}>
              <button type="button" className={modalStyles.headerBtn} onClick={handleBackToMenu}>
                돌아가기
              </button>
              <h2 className={modalStyles.title}>가입 신청 인원</h2>
              <span style={{ minWidth: '4rem' }} />
            </header>
            <div className={tabStyles.subForm} style={{ padding: 'var(--sp-5)' }}>
              {joinRequestError && <p className={tabStyles.errorText}>{joinRequestError}</p>}
              <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-secondary)', margin: '0 0 var(--sp-2) 0' }}>
                총 {joinRequests.length}명
              </p>
              <div className={tableStyles.tableCard}>
                <div className={tableStyles.tableWrap}>
                  <table className={tableStyles.table}>
                    <thead>
                      <tr>
                        <th>닉네임</th>
                        <th>신청일</th>
                        <th>답변</th>
                        <th>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {joinRequestsLoading ? (
                        <tr className={tableStyles.emptyRow}>
                          <td colSpan={4}>불러오는 중...</td>
                        </tr>
                      ) : joinRequests.length === 0 ? (
                        <tr className={tableStyles.emptyRow}>
                          <td colSpan={4}>대기 중인 가입 신청이 없습니다.</td>
                        </tr>
                      ) : (
                        joinRequests.map((req) => {
                          const parsedAnswers: string[] = (() => {
                            if (!req.answer) return []
                            try {
                              const p = JSON.parse(req.answer)
                              if (Array.isArray(p)) return p
                            } catch { /* 구버전 단일 문자열 */ }
                            return [req.answer]
                          })()
                          const questions = group.joinQuestions ?? []
                          const isExpanded = expandedRequestId === req.requestId
                          const hasAnswers = parsedAnswers.length > 0

                          return (
                            <>
                              <tr
                                key={req.requestId}
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/app/profile/${req.username}`)}
                              >
                                <td>
                                  <span className={tableStyles.tableUsername}>{req.nickname}</span>
                                </td>
                                <td className={tableStyles.tableDate}>
                                  {req.createdDate.slice(0, 16).replace('T', ' ')}
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  {hasAnswers ? (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedRequestId(isExpanded ? null : req.requestId)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary)', fontSize: '0.8125rem', padding: 0, textDecoration: 'underline' }}
                                    >
                                      {isExpanded ? '닫기' : '보기'}
                                    </button>
                                  ) : (
                                    <span className={tabStyles.noAnswer}>-</span>
                                  )}
                                </td>
                                <td>
                                  <div className={tabStyles.requestActions} onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      className={tabStyles.approveBtn}
                                      onClick={() => handleApprove(req.requestId)}
                                    >
                                      승인
                                    </button>
                                    <button
                                      type="button"
                                      className={tableStyles.deleteButton}
                                      onClick={() => handleReject(req.requestId)}
                                    >
                                      거절
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr key={`${req.requestId}-answers`}>
                                  <td colSpan={4} style={{ padding: '0', background: 'var(--clr-surface)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                      <thead>
                                        <tr style={{ background: 'var(--clr-bg)' }}>
                                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--clr-text-secondary)', width: '45%', borderBottom: '1px solid var(--clr-border)' }}>질문</th>
                                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--clr-text-secondary)', borderBottom: '1px solid var(--clr-border)' }}>답변</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {parsedAnswers.map((ans, i) => (
                                          <tr key={i} style={{ borderBottom: i < parsedAnswers.length - 1 ? '1px solid var(--clr-border)' : 'none' }}>
                                            <td style={{ padding: '10px 12px', color: 'var(--clr-text)', verticalAlign: 'top' }}>
                                              {questions[i] ?? `Q${i + 1}`}
                                            </td>
                                            <td style={{ padding: '10px 12px', color: 'var(--clr-text-secondary)', verticalAlign: 'top' }}>
                                              {ans || <span style={{ color: 'var(--clr-text-muted)' }}>-</span>}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              )}
                            </>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  // ── 기본 뷰: 설정 메뉴 ──
  return (
    <>
      <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
      <main className={styles.main}>
        <div className={profileStyles.container}>
          <header className={modalStyles.header}>
            <button type="button" className={modalStyles.headerBtn} onClick={handleBack}>
              돌아가기
            </button>
            <h2 className={modalStyles.title}>모임 설정</h2>
            <span style={{ minWidth: '4rem' }} />
          </header>

          {/* 이미지 섹션 */}
          <div className={modalStyles.imageSection}>
            <div className={modalStyles.avatarWrapper}>
              {currentImageSrc && !imgError ? (
                <img
                  src={currentImageSrc}
                  alt="모임 대표 이미지"
                  className={modalStyles.avatarImg}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className={modalStyles.avatarPlaceholder}>
                  {group.name.charAt(0).toUpperCase()}
                </div>
              )}
              {imageUploading && (
                <div className={modalStyles.avatarOverlay}>
                  <span className={modalStyles.avatarOverlayText}>업로드 중…</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className={`btn btn-secondary ${modalStyles.imageChangeBtn}`}
              disabled={imageUploading}
              onClick={() => imageInputRef.current?.click()}
            >
              사진 변경
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className={modalStyles.hiddenFileInput}
              onChange={handleImageChange}
            />
          </div>
          <hr className={modalStyles.imageDivider} />

          <ul className={profileStyles.settingList}>
            <li className={profileStyles.settingRow} onClick={() => setView('info')}>
              <span className={profileStyles.settingLabel}>모임 이름</span>
              <span className={profileStyles.settingValue}>{group.name}</span>
              <span className={profileStyles.chevron}>›</span>
            </li>
            <li className={profileStyles.settingRow} onClick={() => setView('description')}>
              <span className={profileStyles.settingLabel}>모임 소개</span>
              <span className={profileStyles.settingValue}>
                {group.description
                  ? group.description.slice(0, 20) + (group.description.length > 20 ? '…' : '')
                  : ''}
              </span>
              <span className={profileStyles.chevron}>›</span>
            </li>
            <li className={profileStyles.settingRow} onClick={() => setView('memberCount')}>
              <span className={profileStyles.settingLabel}>모임 인원 변경</span>
              <span className={profileStyles.settingValue}>{group.maxMemberCount}명</span>
              <span className={profileStyles.chevron}>›</span>
            </li>
            <li className={profileStyles.settingRow} onClick={() => setView('joinRequests')}>
              <span className={profileStyles.settingLabel}>가입 신청 인원</span>
              <span className={profileStyles.settingValue}>{joinRequests.length > 0 ? `${joinRequests.length}명` : ''}</span>
              <span className={profileStyles.chevron}>›</span>
            </li>
            <li className={profileStyles.settingRow} onClick={() => setView('joinType')}>
              <span className={profileStyles.settingLabel}>가입 방식</span>
              <span className={profileStyles.settingValue}>
                {group.joinType === 'OPEN' ? '자유' : '승인'}
              </span>
              <span className={profileStyles.chevron}>›</span>
            </li>
            <li
              className={profileStyles.settingRow}
              onClick={() => alert('모임장 변경 기능은 준비 중입니다.')}
            >
              <span className={profileStyles.settingLabel}>모임장 변경</span>
              <span className={profileStyles.settingValue} />
              <span className={profileStyles.chevron}>›</span>
            </li>
            <li
              className={profileStyles.settingRow}
              style={{ cursor: 'pointer' }}
              onClick={actionLoading ? undefined : handleDeleteGroup}
            >
              <span className={profileStyles.settingLabel} style={{ color: 'var(--clr-error)' }}>
                모임 삭제
              </span>
              <span className={profileStyles.settingValue} />
              <span className={profileStyles.chevron} style={{ color: 'var(--clr-error)' }}>›</span>
            </li>
          </ul>
        </div>
      </main>
    </>
  )
}
