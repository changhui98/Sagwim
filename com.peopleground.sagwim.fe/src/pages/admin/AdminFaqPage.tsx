import { useCallback, useEffect, useRef, useState } from 'react'
import confirmDialogStyles from '../../components/common/ConfirmDialog.module.css'
import {
  createAdminFaq,
  deleteAdminFaq,
  getAdminFaqs,
  toggleAdminFaqPublished,
  updateAdminFaq,
} from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Skeleton } from '../../components/common/Skeleton'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { SuccessDialog } from '../../components/common/SuccessDialog'
import { Pagination } from '../../components/common/Pagination'
import { ToggleSwitch } from '../../components/common/ToggleSwitch'
import type { AdminFaqResponse } from '../../types/faq'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminFaqPage.module.css'

const PAGE_SIZE = 20

interface FormState {
  question: string
  answer: string
  displayOrder: string
  published: boolean
}

const EMPTY_FORM: FormState = {
  question: '',
  answer: '',
  displayOrder: '0',
  published: true,
}

export function AdminFaqPage() {
  const { token } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [faqs, setFaqs] = useState<AdminFaqResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')

  // 등록/수정 모달: editTarget이 null이면 등록, 값이 있으면 해당 FAQ 수정
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminFaqResponse | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)

  const [togglingId, setTogglingId] = useState<number | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<AdminFaqResponse | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const questionRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

  const loadFaqs = useCallback(
    async (targetPage: number) => {
      try {
        setLoading(true)
        setError('')
        const response = await getAdminFaqs(token, targetPage, PAGE_SIZE)
        setFaqs(response.content)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'FAQ 목록 조회 실패'
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
    loadFaqs(0)
  }, [loadFaqs])

  useEffect(() => {
    if (formOpen) {
      setTimeout(() => questionRef.current?.focus(), 50)
    }
  }, [formOpen])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadFaqs(nextPage)
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError('')
    setFormOpen(true)
  }

  const openEdit = (faq: AdminFaqResponse) => {
    setEditTarget(faq)
    setForm({
      question: faq.question,
      answer: faq.answer,
      displayOrder: String(faq.displayOrder),
      published: faq.published,
    })
    setError('')
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  const handleSubmit = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      setFormLoading(true)
      setError('')
      const body = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        displayOrder: Number.isNaN(parseInt(form.displayOrder, 10))
          ? 0
          : parseInt(form.displayOrder, 10),
        published: form.published,
      }
      if (editTarget) {
        await updateAdminFaq(token, editTarget.id, body)
      } else {
        await createAdminFaq(token, body)
      }
      closeForm()
      setFormSuccess(true)
      loadFaqs(page)
    } catch (err) {
      const message = err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.'
      setError(message)
      handleUnauthorized(err)
    } finally {
      submittingRef.current = false
      setFormLoading(false)
    }
  }

  const handleToggle = async (faq: AdminFaqResponse) => {
    try {
      setTogglingId(faq.id)
      setError('')
      await toggleAdminFaqPublished(token, faq.id)
      await loadFaqs(page)
    } catch (err) {
      const message = err instanceof Error ? err.message : '노출 상태 변경 중 오류가 발생했습니다.'
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
      await deleteAdminFaq(token, deleteTarget.id)
      setDeleteTarget(null)
      setDeleteSuccess(true)
      loadFaqs(page)
    } catch (err) {
      const message = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.'
      setError(message)
      handleUnauthorized(err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const modalOpen = formOpen || deleteTarget !== null
  const formValid = form.question.trim() !== '' && form.answer.trim() !== ''

  return (
    <div className={pageStyles.container}>
      <div className={pageStyles.header}>
        <h1 className={pageStyles.title}>FAQ 관리</h1>
        <button type="button" className={pageStyles.addButton} onClick={openCreate}>
          <span className={pageStyles.addButtonIcon}>+</span>
          FAQ 추가
        </button>
      </div>
      <p className={pageStyles.subtitle}>
        클라이언트 "자주 묻는 질문" 페이지에 노출되는 FAQ를 관리합니다. 노출을 끄면 사용자에게
        보이지 않습니다.
      </p>

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
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '34%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>순서</th>
                    <th>질문</th>
                    <th>답변</th>
                    <th>노출</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.length === 0 ? (
                    <tr className={tableStyles.emptyRow}>
                      <td colSpan={5}>등록된 FAQ가 없습니다.</td>
                    </tr>
                  ) : (
                    faqs.map((faq) => (
                      <tr key={faq.id}>
                        <td className={tableStyles.tableSecondary}>{faq.displayOrder}</td>
                        <td>
                          <span className={tableStyles.tableUsername}>{faq.question}</span>
                        </td>
                        <td className={pageStyles.answerCell}>{faq.answer}</td>
                        <td>
                          <div style={{ display: 'inline-flex' }}>
                            <ToggleSwitch
                              checked={faq.published}
                              disabled={togglingId === faq.id || loading}
                              onChange={() => handleToggle(faq)}
                              ariaLabel={`${faq.question} 노출`}
                              onLabel="게시"
                              offLabel="숨김"
                            />
                          </div>
                        </td>
                        <td>
                          <div className={pageStyles.actions}>
                            <button
                              type="button"
                              className={pageStyles.editButton}
                              onClick={() => openEdit(faq)}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              className={pageStyles.deleteButton}
                              onClick={() => setDeleteTarget(faq)}
                              disabled={deleteLoading}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
        isOpen={formOpen}
        title={editTarget ? 'FAQ 수정' : 'FAQ 등록'}
        message=""
        confirmLabel={editTarget ? '수정' : '등록'}
        confirmVariant="primary"
        isLoading={formLoading}
        confirmDisabled={!formValid}
        onConfirm={handleSubmit}
        onCancel={closeForm}
      >
        <div className={pageStyles.formBody}>
          <div className={confirmDialogStyles.reasonField}>
            <label htmlFor="faq-question" className={confirmDialogStyles.reasonLabel}>
              질문 <span aria-hidden="true">*</span>
            </label>
            <input
              id="faq-question"
              ref={questionRef}
              type="text"
              maxLength={255}
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              placeholder="질문을 입력하세요."
              className={pageStyles.field}
            />
          </div>

          <div className={confirmDialogStyles.reasonField}>
            <label htmlFor="faq-answer" className={confirmDialogStyles.reasonLabel}>
              답변 <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="faq-answer"
              rows={5}
              value={form.answer}
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              placeholder="답변을 입력하세요."
              className={pageStyles.field}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className={pageStyles.formRow}>
            <div className={confirmDialogStyles.reasonField} style={{ flex: '0 0 120px' }}>
              <label htmlFor="faq-order" className={confirmDialogStyles.reasonLabel}>
                정렬순서
              </label>
              <input
                id="faq-order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                className={pageStyles.field}
              />
            </div>

            <div className={pageStyles.publishedField}>
              <span className={confirmDialogStyles.reasonLabel}>노출</span>
              <ToggleSwitch
                checked={form.published}
                onChange={(next) => setForm((f) => ({ ...f, published: next }))}
                ariaLabel="노출 여부"
                onLabel="게시"
                offLabel="숨김"
              />
            </div>
          </div>

          {error && (
            <p style={{ color: 'var(--clr-error)', fontSize: '0.875rem', margin: 0 }}>{error}</p>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="FAQ 삭제"
        message={
          deleteTarget
            ? `"${deleteTarget.question}" 항목을 삭제하시겠습니까? 삭제하면 복구할 수 없습니다.`
            : ''
        }
        confirmLabel="삭제"
        confirmVariant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        {deleteTarget && error && (
          <p style={{ color: 'var(--clr-error)', fontSize: '0.875rem', margin: 0 }}>{error}</p>
        )}
      </ConfirmDialog>

      <SuccessDialog
        isOpen={formSuccess}
        title="저장되었습니다"
        message="FAQ가 저장되었습니다."
        onClose={() => setFormSuccess(false)}
      />

      <SuccessDialog
        isOpen={deleteSuccess}
        title="삭제되었습니다"
        message="선택한 FAQ를 삭제했습니다."
        onClose={() => setDeleteSuccess(false)}
      />
    </div>
  )
}
