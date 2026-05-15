import { useCallback, useEffect, useRef, useState } from 'react'
import confirmDialogStyles from '../../components/common/ConfirmDialog.module.css'
import {
  createAdminForbiddenWord,
  deleteAdminForbiddenWord,
  getAdminForbiddenWords,
  restoreAdminForbiddenWord,
  updateAdminForbiddenWord,
} from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Skeleton } from '../../components/common/Skeleton'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { SuccessDialog } from '../../components/common/SuccessDialog'
import { Pagination } from '../../components/common/Pagination'
import { formatDateTime } from '../../utils/dateUtils'
import type { ForbiddenWordResponse } from '../../types/moderation'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminPostListPage.module.css'

const PAGE_SIZE = 10

type ModalMode = 'create' | 'edit' | 'delete' | 'restore'

interface ModalState {
  mode: ModalMode
  target?: ForbiddenWordResponse
}

export function AdminForbiddenWordsPage() {
  const { token } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [words, setWords] = useState<ForbiddenWordResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')

  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [inputWord, setInputWord] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [successMode, setSuccessMode] = useState<ModalMode | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const loadWords = useCallback(
    async (targetPage: number) => {
      try {
        setLoading(true)
        setError('')
        const response = await getAdminForbiddenWords(token, targetPage, PAGE_SIZE)
        setWords(response.content)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (err) {
        const message = err instanceof Error ? err.message : '금지 단어 목록 조회 실패'
        setError(message)
        handleUnauthorized(err)
      } finally {
        setLoading(false)
        setInitialLoad(false)
      }
    },
    [token, handleUnauthorized],
  )

  useEffect(() => {
    loadWords(0)
  }, [loadWords])

  // 모달이 열릴 때 input에 포커스
  useEffect(() => {
    if (modalState?.mode === 'create' || modalState?.mode === 'edit') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [modalState])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadWords(nextPage)
  }

  const openCreate = () => {
    setInputWord('')
    setModalState({ mode: 'create' })
  }

  const openEdit = (word: ForbiddenWordResponse) => {
    setInputWord(word.word)
    setModalState({ mode: 'edit', target: word })
  }

  const openDelete = (word: ForbiddenWordResponse) => {
    setModalState({ mode: 'delete', target: word })
  }

  const openRestore = (word: ForbiddenWordResponse) => {
    setModalState({ mode: 'restore', target: word })
  }

  const closeModal = () => {
    setModalState(null)
    setInputWord('')
    setError('')
  }

  const handleConfirm = async () => {
    if (!modalState) return

    try {
      setActionLoading(true)
      setError('')

      if (modalState.mode === 'create') {
        await createAdminForbiddenWord(token, inputWord)
      } else if (modalState.mode === 'edit' && modalState.target) {
        await updateAdminForbiddenWord(token, modalState.target.id, inputWord)
      } else if (modalState.mode === 'delete' && modalState.target) {
        await deleteAdminForbiddenWord(token, modalState.target.id)
      } else if (modalState.mode === 'restore' && modalState.target) {
        await restoreAdminForbiddenWord(token, modalState.target.id)
      }

      const currentMode = modalState.mode
      closeModal()
      setSuccessMode(currentMode)
      loadWords(page)
    } catch (err) {
      // M003(중복) 등 백엔드 에러 메시지를 그대로 노출
      const message = err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.'
      setError(message)
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const modalTitle = () => {
    if (!modalState) return ''
    if (modalState.mode === 'create') return '금지 단어 등록'
    if (modalState.mode === 'edit') return '금지 단어 수정'
    if (modalState.mode === 'restore') return '금지 단어 복원'
    return '금지 단어 삭제'
  }

  const modalMessage = () => {
    if (!modalState) return ''
    if (modalState.mode === 'delete') {
      return `"${modalState.target?.word}" 단어를 삭제하시겠습니까?`
    }
    if (modalState.mode === 'restore') {
      return `"${modalState.target?.word}" 단어를 다시 차단 목록에 추가하시겠습니까?`
    }
    return ''
  }

  const confirmLabel = () => {
    if (!modalState) return '확인'
    if (modalState.mode === 'create') return '등록'
    if (modalState.mode === 'edit') return '수정'
    if (modalState.mode === 'restore') return '복원'
    return '삭제'
  }

  const successTitle = () => {
    if (successMode === 'create') return '금지 단어가 등록되었습니다'
    if (successMode === 'edit') return '금지 단어가 수정되었습니다'
    if (successMode === 'restore') return '금지 단어가 복원되었습니다'
    return '금지 단어가 삭제되었습니다'
  }

  const successMessage = () => {
    if (successMode === 'create') return '새 금지 단어를 등록했습니다.'
    if (successMode === 'edit') return '금지 단어를 수정했습니다.'
    if (successMode === 'restore') return '단어가 복원되었습니다.'
    return '선택한 금지 단어를 삭제했습니다.'
  }

  const isInputMode = modalState?.mode === 'create' || modalState?.mode === 'edit'

  return (
    <div className={pageStyles.container}>
      {error && !modalState && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}

      <div className={tableStyles.tableCard}>
        {initialLoad ? (
          <div style={{ padding: 'var(--sp-6)' }}>
            <Skeleton height="300px" />
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--sp-3) var(--sp-4)',
                borderBottom: '1px solid var(--clr-border)',
              }}
            >
              <span className={tableStyles.totalCount} style={{ padding: 0, border: 'none' }}>
                총 {totalElements.toLocaleString()}건
              </span>
              <button
                type="button"
                onClick={openCreate}
                aria-label="단어 등록"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  color: '#000',
                  fontSize: '1.25rem',
                  lineHeight: 1,
                }}
              >
                +
              </button>
            </div>

            <div className={tableStyles.tableWrap} style={{ position: 'relative' }}>
              {loading && <LoadingSpinner overlay />}
              <table className={tableStyles.table} style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>금지 단어</th>
                    <th>등록자</th>
                    <th>등록일</th>
                    <th style={{ textAlign: 'right' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {words.length === 0 ? (
                    <tr className={tableStyles.emptyRow}>
                      <td colSpan={4}>등록된 금지 단어가 없습니다.</td>
                    </tr>
                  ) : (
                    words.map((word) => {
                      const isDeleted = word.deletedDate !== null
                      return (
                        <tr key={word.id}>
                          <td>
                            {isDeleted ? (
                              <span
                                style={{
                                  textDecoration: 'line-through',
                                  color: 'var(--clr-text-muted)',
                                }}
                              >
                                {word.word}
                              </span>
                            ) : (
                              <span className={tableStyles.tableUsername}>{word.word}</span>
                            )}
                          </td>
                          <td className={tableStyles.tableSecondary}>
                            {word.createdByNickname != null
                              ? `@${word.createdByNickname}`
                              : '시스템'}
                          </td>
                          <td className={tableStyles.tableDate}>
                            {formatDateTime(word.createdDate)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>
                              {isDeleted ? (
                                <button
                                  type="button"
                                  className={tableStyles.refreshButton}
                                  onClick={() => openRestore(word)}
                                  disabled={actionLoading}
                                >
                                  복원
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className={tableStyles.refreshButton}
                                    onClick={() => openEdit(word)}
                                    disabled={actionLoading}
                                  >
                                    수정
                                  </button>
                                  <button
                                    type="button"
                                    className={tableStyles.deleteButton}
                                    onClick={() => openDelete(word)}
                                    disabled={actionLoading}
                                  >
                                    삭제
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disabled={loading}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={modalState !== null}
        title={modalTitle()}
        message={modalMessage()}
        confirmLabel={confirmLabel()}
        confirmVariant={modalState?.mode === 'delete' ? 'danger' : 'primary'}
        isLoading={actionLoading}
        confirmDisabled={isInputMode && inputWord.trim() === ''}
        onConfirm={handleConfirm}
        onCancel={closeModal}
      >
        {/* 등록/수정 모달: 단어 입력 필드 */}
        {isInputMode && (
          <div className={confirmDialogStyles.reasonField}>
            <label htmlFor="forbidden-word-input" className={confirmDialogStyles.reasonLabel}>
              금지 단어 <span aria-hidden="true">*</span>
            </label>
            <input
              id="forbidden-word-input"
              ref={inputRef}
              type="text"
              maxLength={100}
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputWord.trim() !== '') {
                  handleConfirm()
                }
              }}
              placeholder="등록할 금지 단어를 입력하세요."
              style={{
                width: '100%',
                padding: 'var(--sp-3)',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--r-md)',
                background: 'var(--clr-bg)',
                color: 'var(--clr-text)',
                fontSize: '0.9375rem',
                boxSizing: 'border-box',
                marginTop: 'var(--sp-1)',
              }}
            />
            {/* 백엔드 에러 (M003 중복 등) 인라인 노출 */}
            {error && (
              <p style={{ color: 'var(--clr-error)', fontSize: '0.875rem', margin: 0 }}>
                {error}
              </p>
            )}
          </div>
        )}
        {/* 복원 모달: 에러 인라인 노출 (M003 이미 활성 단어 존재 등) */}
        {modalState?.mode === 'restore' && error && (
          <p style={{ color: 'var(--clr-error)', fontSize: '0.875rem', margin: 0 }}>
            {error}
          </p>
        )}
      </ConfirmDialog>

      <SuccessDialog
        isOpen={successMode !== null}
        title={successTitle()}
        message={successMessage()}
        onClose={() => setSuccessMode(null)}
      />
    </div>
  )
}
