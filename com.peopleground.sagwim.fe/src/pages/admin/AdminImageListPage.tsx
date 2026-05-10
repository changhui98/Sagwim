import { useCallback, useEffect, useState } from 'react'
import { deleteAdminImage, getAdminImages } from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useHandleUnauthorized } from '../../hooks/useHandleUnauthorized'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Skeleton } from '../../components/common/Skeleton'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { SuccessDialog } from '../../components/common/SuccessDialog'
import { Pagination } from '../../components/common/Pagination'
import { formatDateTime } from '../../utils/dateUtils'
import type { AdminImageResponse } from '../../types/image'
import tableStyles from '../../components/admin/adminTable.module.css'
import pageStyles from './AdminImageListPage.module.css'
import confirmDialogStyles from '../../components/common/ConfirmDialog.module.css'

const PAGE_SIZE = 10

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AdminImageListPage() {
  const { token, meRole } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [images, setImages] = useState<AdminImageResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<AdminImageResponse | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')

  const loadImages = useCallback(
    async (targetPage: number) => {
      try {
        setLoading(true)
        setError('')
        const response = await getAdminImages(token, targetPage, PAGE_SIZE)
        setImages(response.content)
        setTotalPages(response.totalPages)
      } catch (err) {
        const message = err instanceof Error ? err.message : '이미지 목록 조회 실패'
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
    loadImages(0)
  }, [loadImages])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadImages(nextPage)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      setDeleteLoading(true)
      await deleteAdminImage(token, deleteTarget.id, deleteReason)
      setDeleteTarget(null)
      setDeleteReason('')
      setDeleteSuccess(true)
      loadImages(page)
    } catch (err) {
      const message = err instanceof Error ? err.message : '이미지 삭제 실패'
      setError(message)
      handleUnauthorized(err)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className={pageStyles.container}>
      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <div className={tableStyles.tableCard}>
        {initialLoad ? (
          <div style={{ padding: 'var(--sp-6)' }}>
            <Skeleton height="300px" />
          </div>
        ) : (
          <>
            <div className={tableStyles.tableWrap} style={{ position: 'relative' }}>
              {loading && <LoadingSpinner overlay />}
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>이미지 코드</th>
                    <th>미리보기</th>
                    <th>원본 파일명</th>
                    <th>출처</th>
                    <th>업로드한 사람</th>
                    <th>파일 크기</th>
                    <th>유형</th>
                    <th>업로드일</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {images.length === 0 ? (
                    <tr className={tableStyles.emptyRow}>
                      <td colSpan={10}>등록된 이미지가 없습니다.</td>
                    </tr>
                  ) : (
                    images.map((image) => (
                      <tr key={image.id}>
                        <td className={tableStyles.tableSecondary} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {image.imageCode}
                        </td>
                        <td>
                          <img
                            src={image.fileUrl}
                            alt={image.originalFilename}
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                          />
                        </td>
                        <td className={tableStyles.tableUsername}>
                          {image.originalFilename}
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          {image.targetLabel}
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          {image.uploaderUsername}
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          {formatFileSize(image.fileSize)}
                        </td>
                        <td className={tableStyles.tableSecondary}>
                          {image.contentType}
                        </td>
                        <td className={tableStyles.tableDate}>
                          {formatDateTime(image.createdDate)}
                        </td>
                        <td>
                          <span className="badge badge-success">활성</span>
                        </td>
                        <td>
                          {meRole === 'ADMIN' && (
                            <button
                              type="button"
                              className={tableStyles.deleteButton}
                              onClick={() => setDeleteTarget(image)}
                              disabled={deleteLoading}
                            >
                              삭제
                            </button>
                          )}
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
        isOpen={deleteTarget !== null}
        title="이미지 삭제"
        message={
          deleteTarget
            ? `'${deleteTarget.originalFilename}' 이미지를 삭제하시겠습니까?`
            : ''
        }
        confirmLabel="삭제"
        confirmVariant="danger"
        isLoading={deleteLoading}
        confirmDisabled={deleteReason.trim() === ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteReason('')
        }}
      >
        <div className={confirmDialogStyles.reasonField}>
          <label htmlFor="image-delete-reason" className={confirmDialogStyles.reasonLabel}>
            삭제 사유 <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="image-delete-reason"
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
        title="이미지가 삭제되었습니다"
        message="선택한 이미지를 삭제 처리했어요."
        onClose={() => setDeleteSuccess(false)}
      />
    </div>
  )
}
