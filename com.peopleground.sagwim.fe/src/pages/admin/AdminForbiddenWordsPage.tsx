import { useCallback, useEffect, useRef, useState } from 'react'
import confirmDialogStyles from '../../components/common/ConfirmDialog.module.css'
import {
  createAdminForbiddenWord,
  deleteAdminForbiddenWord,
  getAdminForbiddenWords,
  setForbiddenWordStatus,
} from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Skeleton } from '../../components/common/Skeleton'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { SuccessDialog } from '../../components/common/SuccessDialog'
import { Pagination } from '../../components/common/Pagination'
import { ToggleSwitch } from '../../components/common/ToggleSwitch'
import { formatDateTime } from '../../utils/dateUtils'
import type { ForbiddenWordResponse } from '../../types/moderation'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminForbiddenWordsPage.module.css'

const PAGE_SIZE = 10

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
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword)

  const [createOpen, setCreateOpen] = useState(false)
  const [inputWord, setInputWord] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createSuccess, setCreateSuccess] = useState(false)

  const [togglingId, setTogglingId] = useState<number | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<ForbiddenWordResponse | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

  const loadWords = useCallback(
    async (targetPage: number, searchKeyword: string) => {
      try {
        setLoading(true)
        setError('')
        const response = await getAdminForbiddenWords(token, targetPage, PAGE_SIZE, searchKeyword)
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

  // 디바운스된 검색어로 자동 검색 (첫 로드도 이 effect가 담당)
  useEffect(() => {
    setPage(0)
    loadWords(0, debouncedKeyword)
  }, [debouncedKeyword, loadWords])

  // 등록 모달이 열릴 때 input에 포커스
  useEffect(() => {
    if (createOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [createOpen])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadWords(nextPage, keyword)
  }

  const openCreate = () => {
    setInputWord('')
    setError('')
    setCreateOpen(true)
  }

  const closeCreate = () => {
    setCreateOpen(false)
    setInputWord('')
    setError('')
  }

  const handleCreate = async () => {
    // 이중 제출 가드 (한글 IME Enter 중복 keydown 등으로 두 번 호출되는 것 방지)
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      setCreateLoading(true)
      setError('')
      await createAdminForbiddenWord(token, inputWord)
      closeCreate()
      setCreateSuccess(true)
      loadWords(page, keyword)
    } catch (err) {
      // M003(중복) 등 백엔드 에러 메시지를 그대로 노출
      const message = err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.'
      setError(message)
      handleUnauthorized(err)
    } finally {
      submittingRef.current = false
      setCreateLoading(false)
    }
  }

  // 토글: 활성(ACTIVE, 차단 중) ↔ 비활성(INACTIVE, 차단 안 함)
  const handleToggle = async (word: ForbiddenWordResponse) => {
    const nextStatus = word.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      setTogglingId(word.id)
      setError('')
      await setForbiddenWordStatus(token, word.id, nextStatus)
      await loadWords(page, keyword)
    } catch (err) {
      const message = err instanceof Error ? err.message : '상태 변경 중 오류가 발생했습니다.'
      setError(message)
      handleUnauthorized(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleteLoading(true)
      setError('')
      await deleteAdminForbiddenWord(token, deleteTarget.id)
      setDeleteTarget(null)
      setDeleteSuccess(true)
      loadWords(page, keyword)
    } catch (err) {
      const message = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.'
      setError(message)
      handleUnauthorized(err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const modalOpen = createOpen || deleteTarget !== null

  return (
    <div className={pageStyles.container}>
      <AdminPageHeader
        title="금지 단어"
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="금지 단어 검색"
      >
        <button type="button" className={pageStyles.addButton} onClick={openCreate}>
          <span className={pageStyles.addButtonIcon}>+</span>
          금지 단어 추가
        </button>
      </AdminPageHeader>

      {error && !modalOpen && (
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
            <div className={tableStyles.totalCount}>총 {totalElements.toLocaleString()}건</div>

            <div className={tableStyles.tableWrap} style={{ position: 'relative' }}>
              {loading && <LoadingSpinner overlay />}
              <table
                className={tableStyles.table}
                style={{ tableLayout: 'fixed', fontSize: '0.9375rem' }}
              >
                <colgroup>
                  <col style={{ width: '22.5%' }} />
                  <col style={{ width: '22.5%' }} />
                  <col style={{ width: '22.5%' }} />
                  <col style={{ width: '22.5%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>금지 단어</th>
                    <th>등록자</th>
                    <th>상태</th>
                    <th>등록일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {words.length === 0 ? (
                    <tr className={tableStyles.emptyRow}>
                      <td colSpan={5}>등록된 금지 단어가 없습니다.</td>
                    </tr>
                  ) : (
                    words.map((word) => {
                      const isActive = word.status === 'ACTIVE'
                      return (
                        <tr key={word.id}>
                          <td>
                            {isActive ? (
                              <span className={tableStyles.tableUsername}>{word.word}</span>
                            ) : (
                              <span style={{ color: 'var(--clr-text-muted)' }}>{word.word}</span>
                            )}
                          </td>
                          <td className={tableStyles.tableSecondary}>
                            {word.createdByNickname != null ? word.createdByNickname : '시스템'}
                          </td>
                          <td>
                            <div style={{ display: 'inline-flex' }}>
                              <ToggleSwitch
                                checked={isActive}
                                disabled={togglingId === word.id || loading}
                                onChange={() => handleToggle(word)}
                                ariaLabel={`${word.word} 차단`}
                                onLabel="활성"
                                offLabel="비활성"
                              />
                            </div>
                          </td>
                          <td className={tableStyles.tableDate} style={{ fontSize: '0.9375rem' }}>
                            {formatDateTime(word.createdDate)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={pageStyles.deleteButton}
                              onClick={() => setDeleteTarget(word)}
                              disabled={deleteLoading}
                            >
                              삭제
                            </button>
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
        isOpen={createOpen}
        title="금지 단어 등록"
        message=""
        confirmLabel="등록"
        confirmVariant="primary"
        isLoading={createLoading}
        confirmDisabled={inputWord.trim() === ''}
        onConfirm={handleCreate}
        onCancel={closeCreate}
      >
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
              // 한글 IME 조합 중 Enter는 무시 (조합 확정용 keydown으로 인한 이중 제출 방지)
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && inputWord.trim() !== '') {
                handleCreate()
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
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="금지 단어 삭제"
        message={
          deleteTarget
            ? `"${deleteTarget.word}" 단어를 삭제하시겠습니까? 삭제하면 복구할 수 없습니다.`
            : ''
        }
        confirmLabel="삭제"
        confirmVariant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        {deleteTarget && error && (
          <p style={{ color: 'var(--clr-error)', fontSize: '0.875rem', margin: 0 }}>
            {error}
          </p>
        )}
      </ConfirmDialog>

      <SuccessDialog
        isOpen={createSuccess}
        title="금지 단어가 등록되었습니다"
        message="새 금지 단어를 등록했습니다."
        onClose={() => setCreateSuccess(false)}
      />

      <SuccessDialog
        isOpen={deleteSuccess}
        title="금지 단어가 삭제되었습니다"
        message="선택한 금지 단어를 삭제했습니다."
        onClose={() => setDeleteSuccess(false)}
      />
    </div>
  )
}
