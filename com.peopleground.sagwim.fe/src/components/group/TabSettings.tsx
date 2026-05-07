import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPendingJoinRequests, approveJoinRequest, rejectJoinRequest, updateGroupJoinType, getGroupJoinQuestion, updateGroupJoinQuestion } from '../../api/groupApi'
import type { GroupDetailResponse, GroupJoinRequestResponse, GroupJoinType } from '../../types/group'
import pageStyles from '../../pages/GroupDetailPage.module.css'
import styles from './TabSettings.module.css'
import profileStyles from '../../pages/ProfileEditPage.module.css'
import modalStyles from '../profile/ProfileEditModal.module.css'
import tableStyles from '../../components/admin/adminTable.module.css'

type SubView = 'menu' | 'info' | 'memberCount' | 'joinRequests' | 'joinQuestion'

interface TabSettingsProps {
  group: GroupDetailResponse
  token: string
  actionLoading: boolean
  onSaveInfo: (data: { name: string; description: string }) => void
  onSaveMemberCount: (maxMemberCount: number) => void
  onDelete: () => void
  onGroupUpdated: (updated: Partial<GroupDetailResponse>) => void
}

export function TabSettings({ group, token, actionLoading, onSaveInfo, onSaveMemberCount, onDelete, onGroupUpdated }: TabSettingsProps) {
  const navigate = useNavigate()
  const [view, setView] = useState<SubView>('menu')

  const [editName, setEditName] = useState(group.name)
  const [editDescription, setEditDescription] = useState(group.description ?? '')
  const [editMaxMemberCount, setEditMaxMemberCount] = useState(group.maxMemberCount)

  const [joinRequests, setJoinRequests] = useState<GroupJoinRequestResponse[]>([])
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false)
  const [joinRequestError, setJoinRequestError] = useState('')

  const [joinTypeLoading, setJoinTypeLoading] = useState(false)
  const [joinTypeError, setJoinTypeError] = useState('')

  const [editJoinQuestion, setEditJoinQuestion] = useState('')
  const [joinQuestionLoading, setJoinQuestionLoading] = useState(false)
  const [joinQuestionError, setJoinQuestionError] = useState('')

  const handleBackToMenu = () => {
    setView('menu')
    setJoinRequestError('')
    setJoinTypeError('')
    setJoinQuestionError('')
  }

  const loadJoinRequests = useCallback(async () => {
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
  }, [token, group.id])

  const loadJoinQuestion = useCallback(async () => {
    try {
      setJoinQuestionLoading(true)
      setJoinQuestionError('')
      const data = await getGroupJoinQuestion(token, group.id)
      setEditJoinQuestion(data.question ?? '')
    } catch {
      setJoinQuestionError('질문을 불러오지 못했습니다.')
    } finally {
      setJoinQuestionLoading(false)
    }
  }, [token, group.id])

  useEffect(() => {
    if (view === 'joinRequests') loadJoinRequests()
  }, [view, loadJoinRequests])

  useEffect(() => {
    if (view === 'joinQuestion') loadJoinQuestion()
  }, [view, loadJoinQuestion])

  const handleSaveJoinQuestion = async () => {
    try {
      setJoinQuestionLoading(true)
      setJoinQuestionError('')
      await updateGroupJoinQuestion(token, group.id, editJoinQuestion)
      onGroupUpdated({ joinQuestion: editJoinQuestion || null })
      setView('menu')
    } catch {
      setJoinQuestionError('질문 저장에 실패했습니다.')
    } finally {
      setJoinQuestionLoading(false)
    }
  }

  const handleApprove = async (requestId: number) => {
    try {
      setJoinRequestError('')
      await approveJoinRequest(token, group.id, requestId)
      setJoinRequests((prev) => prev.filter((r) => r.requestId !== requestId))
    } catch {
      setJoinRequestError('승인 처리에 실패했습니다.')
    }
  }

  const handleReject = async (requestId: number) => {
    try {
      setJoinRequestError('')
      await rejectJoinRequest(token, group.id, requestId)
      setJoinRequests((prev) => prev.filter((r) => r.requestId !== requestId))
    } catch {
      setJoinRequestError('거절 처리에 실패했습니다.')
    }
  }

  const handleJoinTypeChange = async (joinType: GroupJoinType) => {
    if (joinType === group.joinType) return
    try {
      setJoinTypeLoading(true)
      setJoinTypeError('')
      await updateGroupJoinType(token, group.id, group, joinType)
      onGroupUpdated({ joinType })
    } catch {
      setJoinTypeError('가입 방식 변경에 실패했습니다.')
    } finally {
      setJoinTypeLoading(false)
    }
  }

  if (view === 'info') {
    return (
      <div className={profileStyles.container}>
        <header className={modalStyles.header}>
          <button type="button" className={modalStyles.headerBtn} onClick={handleBackToMenu}>
            돌아가기
          </button>
          <h2 className={modalStyles.title}>모임이름/소개 변경</h2>
          <span style={{ minWidth: '4rem' }} />
        </header>
        <div className={styles.subForm} style={{ padding: 'var(--sp-5)' }}>
          <input
            type="text"
            className={pageStyles.editInput}
            placeholder="모임 이름 (최대 50자)"
            maxLength={50}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <textarea
            className={pageStyles.editTextarea}
            placeholder="모임 설명 (최대 1000자)"
            maxLength={1000}
            rows={4}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <div className={styles.formActions}>
            <button type="button" className={pageStyles.cancelButton} onClick={handleBackToMenu} disabled={actionLoading}>
              취소
            </button>
            <button
              type="button"
              className={pageStyles.saveButton}
              onClick={() => onSaveInfo({ name: editName, description: editDescription })}
              disabled={actionLoading}
            >
              {actionLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'memberCount') {
    return (
      <div className={profileStyles.container}>
        <header className={modalStyles.header}>
          <button type="button" className={modalStyles.headerBtn} onClick={handleBackToMenu}>
            돌아가기
          </button>
          <h2 className={modalStyles.title}>모임 인원 변경</h2>
          <span style={{ minWidth: '4rem' }} />
        </header>
        <div className={styles.subForm} style={{ padding: 'var(--sp-5)' }}>
          <input
            type="number"
            className={pageStyles.editInput}
            min={2}
            max={1000}
            value={editMaxMemberCount}
            onChange={(e) => setEditMaxMemberCount(Number(e.target.value))}
          />
          <div className={styles.formActions}>
            <button type="button" className={pageStyles.cancelButton} onClick={handleBackToMenu} disabled={actionLoading}>
              취소
            </button>
            <button
              type="button"
              className={pageStyles.saveButton}
              onClick={() => onSaveMemberCount(editMaxMemberCount)}
              disabled={actionLoading}
            >
              {actionLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'joinQuestion') {
    return (
      <div className={profileStyles.container}>
        <header className={modalStyles.header}>
          <button type="button" className={modalStyles.headerBtn} onClick={handleBackToMenu}>
            돌아가기
          </button>
          <h2 className={modalStyles.title}>가입 질문 설정</h2>
          <span style={{ minWidth: '4rem' }} />
        </header>
        <div className={styles.subForm} style={{ padding: 'var(--sp-5)' }}>
          {joinQuestionError && <p className={styles.errorText}>{joinQuestionError}</p>}
          <textarea
            className={pageStyles.editTextarea}
            placeholder="가입 신청자에게 물어볼 질문을 입력하세요"
            maxLength={500}
            rows={4}
            value={editJoinQuestion}
            onChange={(e) => setEditJoinQuestion(e.target.value)}
            disabled={joinQuestionLoading}
          />
          <p className={styles.charCount}>{editJoinQuestion.length} / 500</p>
          <div className={styles.formActions}>
            <button type="button" className={pageStyles.cancelButton} onClick={handleBackToMenu} disabled={joinQuestionLoading}>
              취소
            </button>
            <button
              type="button"
              className={pageStyles.saveButton}
              onClick={handleSaveJoinQuestion}
              disabled={joinQuestionLoading}
            >
              {joinQuestionLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'joinRequests') {
    return (
      <div className={profileStyles.container}>
        <header className={modalStyles.header}>
          <button type="button" className={modalStyles.headerBtn} onClick={handleBackToMenu}>
            돌아가기
          </button>
          <h2 className={modalStyles.title}>가입 신청 인원</h2>
          <span style={{ minWidth: '4rem' }} />
        </header>
        <div className={styles.subForm} style={{ padding: 'var(--sp-5)' }}>
          {joinRequestError && <p className={styles.errorText}>{joinRequestError}</p>}
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
                    joinRequests.map((req) => (
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
                        <td className={styles.answerCell}>
                          {req.answer || <span className={styles.noAnswer}>-</span>}
                        </td>
                        <td>
                          <div className={styles.requestActions} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={styles.approveBtn}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={profileStyles.container}>
      <header className={modalStyles.header}>
        <span style={{ minWidth: '4rem' }} />
        <h2 className={modalStyles.title}>모임 설정</h2>
        <span style={{ minWidth: '4rem' }} />
      </header>

      <ul className={profileStyles.settingList}>
        <li className={profileStyles.settingRow} onClick={() => setView('info')}>
          <span className={profileStyles.settingLabel}>모임이름/소개 변경</span>
          <span className={profileStyles.chevron}>›</span>
        </li>
        <li className={profileStyles.settingRow} onClick={() => setView('memberCount')}>
          <span className={profileStyles.settingLabel}>모임 인원 변경</span>
          <span className={profileStyles.settingValue}>{group.maxMemberCount}명</span>
          <span className={profileStyles.chevron}>›</span>
        </li>
        <li className={profileStyles.settingRow} onClick={() => setView('joinRequests')}>
          <span className={profileStyles.settingLabel}>가입 신청 인원</span>
          <span className={profileStyles.chevron}>›</span>
        </li>
        <li className={profileStyles.settingRow} style={{ cursor: 'default' }}>
          <span className={profileStyles.settingLabel}>가입 방식</span>
          <div className={styles.joinTypeToggle} style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className={`${styles.joinTypeBtn} ${group.joinType === 'OPEN' ? styles.joinTypeBtnActive : ''}`}
              onClick={() => handleJoinTypeChange('OPEN')}
              disabled={joinTypeLoading}
            >
              자유
            </button>
            <button
              type="button"
              className={`${styles.joinTypeBtn} ${group.joinType === 'APPROVAL_REQUIRED' ? styles.joinTypeBtnActive : ''}`}
              onClick={() => handleJoinTypeChange('APPROVAL_REQUIRED')}
              disabled={joinTypeLoading}
            >
              승인
            </button>
          </div>
          {joinTypeError && <p className={styles.errorText}>{joinTypeError}</p>}
        </li>
        {group.joinType === 'APPROVAL_REQUIRED' && (
          <li className={profileStyles.settingRow} onClick={() => setView('joinQuestion')}>
            <span className={profileStyles.settingLabel}>가입 질문 설정</span>
            <span className={profileStyles.settingValue}>
              {group.joinQuestion ? group.joinQuestion.slice(0, 20) + (group.joinQuestion.length > 20 ? '…' : '') : '설정 안 됨'}
            </span>
            <span className={profileStyles.chevron}>›</span>
          </li>
        )}
        <li
          className={profileStyles.settingRow}
          onClick={() => alert('모임장 변경 기능은 준비 중입니다.')}
        >
          <span className={profileStyles.settingLabel}>모임장 변경</span>
          <span className={profileStyles.chevron}>›</span>
        </li>
        <li
          className={profileStyles.settingRow}
          style={{ cursor: 'pointer' }}
          onClick={actionLoading ? undefined : onDelete}
        >
          <span className={profileStyles.settingLabel} style={{ color: 'var(--clr-error)' }}>모임 삭제</span>
          <span className={profileStyles.chevron} style={{ color: 'var(--clr-error)' }}>›</span>
        </li>
      </ul>
    </div>
  )
}
