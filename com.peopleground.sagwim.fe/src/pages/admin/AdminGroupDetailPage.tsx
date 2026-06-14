import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { approveAdminGroup, deleteAdminGroup, rejectAdminGroup } from '../../api/adminApi'
import { getGroup, getGroupMembers } from '../../api/groupApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import confirmDialogStyles from '../../components/common/ConfirmDialog.module.css'
import { SuccessDialog } from '../../components/common/SuccessDialog'
import { formatDateTime } from '../../utils/dateUtils'
import { removeKoreaPrefix } from '../../utils/stringUtils'
import {
  GROUP_CATEGORY_LABELS,
  GROUP_MEETING_TYPE_LABELS,
} from '../../types/group'
import type { GroupDetailResponse, GroupJoinType, GroupMemberResponse, GroupMemberRole, GroupStatus } from '../../types/group'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminGroupDetailPage.module.css'

type ConfirmAction = 'approve' | 'reject' | 'delete'

const JOIN_TYPE_LABEL: Record<GroupJoinType, string> = {
  OPEN: '자유 가입',
  APPROVAL_REQUIRED: '승인 후 가입',
}

const ROLE_ORDER: Record<GroupMemberRole, number> = { LEADER: 0, SUB_LEADER: 1, MEMBER: 2 }

function formatJoinedDate(joinedAt: string): string {
  const dt = new Date(joinedAt)
  if (Number.isNaN(dt.getTime())) return '가입일 정보 없음'
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd} 가입`
}

function StatusBadge({ status }: { status: GroupStatus }) {
  if (status === 'PENDING') return <span className={pageStyles.badgePending}>승인 대기중</span>
  if (status === 'ACTIVE') return <span className={pageStyles.badgeActive}>활성</span>
  return <span className={pageStyles.badgeRejected}>거절됨</span>
}

export function AdminGroupDetailPage() {
  const { groupId = '' } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [members, setMembers] = useState<GroupMemberResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [successAction, setSuccessAction] = useState<ConfirmAction | null>(null)
  const [deleteReason, setDeleteReason] = useState('')

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [groupResult, memberResult] = await Promise.allSettled([
        getGroup(token, Number(groupId)),
        getGroupMembers(token, Number(groupId)),
      ])
      if (groupResult.status === 'fulfilled') {
        setGroup(groupResult.value)
      } else {
        const err = groupResult.reason
        setError(err instanceof Error ? err.message : '모임 정보 조회 실패')
        handleUnauthorized(err)
      }
      if (memberResult.status === 'fulfilled') {
        setMembers(memberResult.value.content)
      }
    } finally {
      setLoading(false)
    }
  }, [token, groupId, handleUnauthorized])

  useEffect(() => {
    loadGroup()
  }, [loadGroup])

  const handleConfirm = async () => {
    if (!group || !confirmAction) return
    const action = confirmAction
    try {
      setActionLoading(true)
      if (action === 'approve') {
        await approveAdminGroup(token, group.id)
      } else if (action === 'reject') {
        await rejectAdminGroup(token, group.id)
      } else {
        await deleteAdminGroup(token, group.id, deleteReason)
      }
      setConfirmAction(null)
      setDeleteReason('')
      setSuccessAction(action)
      if (action !== 'delete') {
        loadGroup()
      }
    } catch (err) {
      const label = action === 'approve' ? '승인' : action === 'reject' ? '거절' : '삭제'
      const message = err instanceof Error ? err.message : `모임 ${label} 실패`
      setError(message)
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const sortedMembers = [...members].sort((a, b) => {
    const ra = ROLE_ORDER[a.role] ?? 2
    const rb = ROLE_ORDER[b.role] ?? 2
    if (ra !== rb) return ra - rb
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })

  return (
    <div className={pageStyles.container}>
      <div className={pageStyles.topBar}>
        <button
          type="button"
          className={pageStyles.backButton}
          onClick={() => navigate('/app/admin/groups')}
        >
          <svg
            width="18"
            height="18"
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
          목록으로
        </button>
      </div>

      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className={pageStyles.loadingWrap}>
          <LoadingSpinner />
        </div>
      ) : !group ? (
        <p className={pageStyles.emptyText}>모임 정보를 불러올 수 없습니다.</p>
      ) : (
        <>
          <div className={pageStyles.heroMedia}>
            {group.imageUrl?.trim() ? (
              <img
                src={group.imageUrl}
                alt={`${group.name} 대표 이미지`}
                className={pageStyles.heroImage}
              />
            ) : (
              <div className={pageStyles.heroImagePlaceholder} role="img" aria-label="모임 사진 없음">
                <svg
                  className={pageStyles.placeholderIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <p className={pageStyles.placeholderText}>모임 사진이 없습니다.</p>
              </div>
            )}
          </div>

          <div className={pageStyles.header}>
            <h1 className={pageStyles.groupName}>{group.name}</h1>
            <StatusBadge status={group.status} />
          </div>

          <section className={pageStyles.card}>
            <h2 className={pageStyles.cardTitle}>모임 정보</h2>
            <dl className={pageStyles.infoGrid}>
              <div className={pageStyles.infoItem}>
                <dt>카테고리</dt>
                <dd>{GROUP_CATEGORY_LABELS[group.category]}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>형태</dt>
                <dd>{GROUP_MEETING_TYPE_LABELS[group.meetingType]}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>지역</dt>
                <dd>{removeKoreaPrefix(group.region) || '-'}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>개설자</dt>
                <dd>{group.leaderNickname} (@{group.leaderUsername})</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>가입 유형</dt>
                <dd>{JOIN_TYPE_LABEL[group.joinType]}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>생성일</dt>
                <dd>{formatDateTime(group.createdDate)}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>좋아요</dt>
                <dd>{group.likeCount}</dd>
              </div>
              <div className={`${pageStyles.infoItem} ${pageStyles.infoItemWide}`}>
                <dt>설명</dt>
                <dd>{group.description?.trim() || '-'}</dd>
              </div>
              {group.joinQuestions && group.joinQuestions.length > 0 && (
                <div className={`${pageStyles.infoItem} ${pageStyles.infoItemWide}`}>
                  <dt>가입 질문</dt>
                  <dd>
                    <ul className={pageStyles.questionList}>
                      {group.joinQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className={pageStyles.card}>
            <h2 className={pageStyles.cardTitle}>회원 {group.currentMemberCount} / {group.maxMemberCount}</h2>
            {sortedMembers.length === 0 ? (
              <p className={pageStyles.emptyText}>아직 회원이 없습니다.</p>
            ) : (
              <ul className={pageStyles.memberList}>
                {sortedMembers.map((m) => (
                  <li key={m.userId} className={pageStyles.memberItem}>
                    <span className={`avatar ${pageStyles.memberAvatar}`}>
                      {m.profileImageUrl ? (
                        <img
                          src={m.profileImageUrl}
                          alt={`${m.nickname} 프로필`}
                          className={pageStyles.memberAvatarImg}
                        />
                      ) : (
                        m.nickname.charAt(0).toUpperCase()
                      )}
                    </span>
                    <div className={pageStyles.memberInfo}>
                      <span className={pageStyles.memberName}>
                        {m.nickname}
                        <span className={pageStyles.memberUsername}>@{m.username}</span>
                      </span>
                      <span className={pageStyles.memberJoined}>{formatJoinedDate(m.joinedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={pageStyles.card}>
            <h2 className={pageStyles.cardTitle}>관리</h2>
            <div className={pageStyles.actions}>
              {(group.status === 'PENDING' || group.status === 'REJECTED') && (
                <button
                  type="button"
                  className={tableStyles.refreshButton}
                  onClick={() => setConfirmAction('approve')}
                  disabled={actionLoading}
                >
                  승인
                </button>
              )}
              {group.status === 'PENDING' && (
                <button
                  type="button"
                  className={tableStyles.deleteButton}
                  onClick={() => setConfirmAction('reject')}
                  disabled={actionLoading}
                >
                  거절
                </button>
              )}
              {group.status === 'ACTIVE' && (
                <button
                  type="button"
                  className={tableStyles.deleteButton}
                  onClick={() => setConfirmAction('delete')}
                  disabled={actionLoading}
                >
                  삭제
                </button>
              )}
            </div>
          </section>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={
          confirmAction === 'approve'
            ? '모임 승인'
            : confirmAction === 'reject'
              ? '모임 거절'
              : '모임 삭제'
        }
        message={
          group
            ? confirmAction === 'approve'
              ? `"${group.name}" 모임을 승인하시겠습니까?`
              : confirmAction === 'reject'
                ? `"${group.name}" 모임을 거절하시겠습니까?`
                : `"${group.name}" 모임을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
            : ''
        }
        confirmLabel={
          confirmAction === 'approve' ? '승인' : confirmAction === 'reject' ? '거절' : '삭제'
        }
        confirmVariant={confirmAction === 'approve' ? 'primary' : 'danger'}
        isLoading={actionLoading}
        confirmDisabled={confirmAction === 'delete' && deleteReason.trim() === ''}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmAction(null)
          setDeleteReason('')
        }}
      >
        {confirmAction === 'delete' && (
          <div className={confirmDialogStyles.reasonField}>
            <label htmlFor="group-detail-delete-reason" className={confirmDialogStyles.reasonLabel}>
              삭제 사유 <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="group-detail-delete-reason"
              className={confirmDialogStyles.reasonTextarea}
              placeholder="삭제 사유를 입력해주세요."
              maxLength={500}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
        )}
      </ConfirmDialog>

      <SuccessDialog
        isOpen={successAction !== null}
        title={
          successAction === 'approve'
            ? '모임이 승인되었습니다'
            : successAction === 'reject'
              ? '모임이 거절되었습니다'
              : '모임이 삭제되었습니다'
        }
        message={
          successAction === 'approve'
            ? '모임이 활성화되어 사용자에게 노출됩니다.'
            : successAction === 'reject'
              ? '모임 개설 요청을 거절했습니다.'
              : '모임이 삭제되었습니다.'
        }
        onClose={() => {
          const wasDelete = successAction === 'delete'
          setSuccessAction(null)
          if (wasDelete) {
            navigate('/app/admin/groups')
          }
        }}
      />
    </div>
  )
}
