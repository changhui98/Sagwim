import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { changeUserRole, deleteAdminUser, getAdminUserDetail } from '../../api/adminApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { RoleDropdown } from '../../components/admin/RoleDropdown'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import confirmDialogStyles from '../../components/common/ConfirmDialog.module.css'
import { SuccessDialog } from '../../components/common/SuccessDialog'
import { getInitials } from '../../utils/stringUtils'
import { formatDate, formatDateTime } from '../../utils/dateUtils'
import type { Gender, UserDetailResponse, UserRole } from '../../types/user'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminUserDetailPage.module.css'

const GENDER_LABEL: Record<Gender, string> = {
  MALE: '남성',
  FEMALE: '여성',
  NONE: '선택 안 함',
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'ADMIN') return <span className={pageStyles.badgeAdmin}>ADMIN</span>
  if (role === 'MANAGER') return <span className={pageStyles.badgeManager}>MANAGER</span>
  return <span className={pageStyles.badgeUser}>USER</span>
}

function ProviderBadge({ provider }: { provider?: string }) {
  if (provider === 'KAKAO') return <span className={tableStyles.badgeKakao}>KAKAO</span>
  if (provider === 'GOOGLE') return <span className={tableStyles.badgeGoogle}>GOOGLE</span>
  return <span className={tableStyles.badgeLocal}>일반</span>
}

export function AdminUserDetailPage() {
  const { username = '' } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { token, logout, meUsername, meRole } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [user, setUser] = useState<UserDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [roleChanging, setRoleChanging] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const deleteReasonRef = useRef<HTMLTextAreaElement>(null)

  const loadUser = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminUserDetail(token, username)
      setUser(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '사용자 정보 조회 실패'
      setError(message)
      handleUnauthorized(err)
    } finally {
      setLoading(false)
    }
  }, [token, username, handleUnauthorized])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user || roleChanging) return
    try {
      setRoleChanging(true)
      await changeUserRole(token, user.username, { role: newRole })
      setUser((prev) => (prev ? { ...prev, role: newRole } : prev))
    } catch (err) {
      const message = err instanceof Error ? err.message : '역할 변경 실패'
      setError(message)
      handleUnauthorized(err)
    } finally {
      setRoleChanging(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!user) return
    try {
      setDeleteLoading(true)
      await deleteAdminUser(token, user.username, deleteReason)
      setDeleteOpen(false)
      setDeleteReason('')
      setDeleteSuccess(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : '사용자 삭제 실패'
      setError(message)
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login', { replace: true })
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const isMyself = user?.username === meUsername
  const canChangeRole = meRole === 'ADMIN' && !isMyself
  const canDelete = !(meRole === 'MANAGER' && user?.role === 'ADMIN') && !isMyself

  return (
    <div className={pageStyles.container}>
      <div className={pageStyles.topBar}>
        <button
          type="button"
          className={pageStyles.backButton}
          onClick={() => navigate('/app/admin/users')}
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
      ) : !user ? (
        <p className={pageStyles.emptyText}>사용자 정보를 불러올 수 없습니다.</p>
      ) : (
        <>
          <div className={pageStyles.profileHeader}>
            <span className={`avatar ${pageStyles.avatar}`}>
              {user.profileImageUrl?.trim() ? (
                <img
                  src={user.profileImageUrl}
                  alt={`${user.nickname} 프로필`}
                  className={pageStyles.avatarImage}
                />
              ) : (
                getInitials(user.nickname)
              )}
            </span>
            <div className={pageStyles.profileHeading}>
              <div className={pageStyles.nameRow}>
                <h1 className={pageStyles.nickname}>{user.nickname}</h1>
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>

          <section className={pageStyles.card}>
            <h2 className={pageStyles.cardTitle}>프로필 정보</h2>
            <dl className={pageStyles.infoGrid}>
              <div className={pageStyles.infoItem}>
                <dt>아이디</dt>
                <dd>{user.username}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>이메일</dt>
                <dd>{user.userEmail || '-'}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>가입 경로</dt>
                <dd>
                  <ProviderBadge provider={user.provider} />
                </dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>주소</dt>
                <dd>{user.address || '-'}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>성별</dt>
                <dd>{user.gender ? GENDER_LABEL[user.gender] : '-'}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>생일</dt>
                <dd>{formatDate(user.birthDate)}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>검색 노출</dt>
                <dd>{user.isSearchable === false ? '비노출' : '노출'}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>노출 범위</dt>
                <dd>{user.exposureRangeKm != null ? `${user.exposureRangeKm}km` : '-'}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>가입일</dt>
                <dd>{formatDateTime(user.createdAt)}</dd>
              </div>
              <div className={pageStyles.infoItem}>
                <dt>수정일</dt>
                <dd>{formatDateTime(user.modifiedAt)}</dd>
              </div>
              <div className={`${pageStyles.infoItem} ${pageStyles.infoItemWide}`}>
                <dt>소개</dt>
                <dd>{user.bio?.trim() || '-'}</dd>
              </div>
            </dl>
          </section>

          {(canChangeRole || canDelete) && (
            <section className={pageStyles.card}>
              <h2 className={pageStyles.cardTitle}>관리</h2>
              <div className={pageStyles.actions}>
                {canChangeRole && (
                  <div className={pageStyles.actionItem}>
                    <span className={pageStyles.actionLabel}>역할 변경</span>
                    <RoleDropdown
                      role={(user.role as UserRole) ?? 'USER'}
                      disabled={roleChanging}
                      onChange={handleRoleChange}
                    />
                  </div>
                )}
                {canDelete && (
                  <div className={pageStyles.actionItem}>
                    <span className={pageStyles.actionLabel}>사용자 삭제</span>
                    <button
                      type="button"
                      className={tableStyles.deleteButton}
                      onClick={() => setDeleteOpen(true)}
                      disabled={deleteLoading}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={deleteOpen}
        title="사용자 삭제"
        message={user ? `'${user.nickname}' 사용자를 삭제하시겠습니까?` : ''}
        confirmLabel="삭제"
        confirmVariant="danger"
        isLoading={deleteLoading}
        confirmDisabled={deleteReason.trim() === ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteOpen(false)
          setDeleteReason('')
        }}
      >
        <div className={confirmDialogStyles.reasonField}>
          <label htmlFor="user-detail-delete-reason" className={confirmDialogStyles.reasonLabel}>
            삭제 사유 <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="user-detail-delete-reason"
            ref={deleteReasonRef}
            className={confirmDialogStyles.reasonTextarea}
            placeholder="삭제 사유를 입력해주세요."
            maxLength={500}
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
          />
        </div>
      </ConfirmDialog>

      <SuccessDialog
        isOpen={deleteSuccess}
        title="사용자가 삭제되었습니다"
        message="선택한 사용자를 삭제 처리했어요."
        onClose={() => {
          setDeleteSuccess(false)
          navigate('/app/admin/users')
        }}
      />
    </div>
  )
}
