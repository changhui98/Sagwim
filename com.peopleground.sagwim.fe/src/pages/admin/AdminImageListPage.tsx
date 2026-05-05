import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAdminImage, getAdminImages } from '../../api/adminApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Skeleton } from '../../components/common/Skeleton'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { SuccessDialog } from '../../components/common/SuccessDialog'
import { formatDateTime } from '../../utils/dateUtils'
import type { AdminImageResponse } from '../../types/image'
import styles from './AdminUserListPage.module.css'

const PAGE_SIZE = 10
const MAX_VISIBLE_PAGES = 5

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AdminImageListPage() {
  const navigate = useNavigate()
  const { token, logout, meRole } = useAuth()

  const [images, setImages] = useState<AdminImageResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<AdminImageResponse | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )

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
      await deleteAdminImage(token, deleteTarget.id)
      setDeleteTarget(null)
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

  const getPageNumbers = (): number[] => {
    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i)
    }
    const half = Math.floor(MAX_VISIBLE_PAGES / 2)
    let start = Math.max(0, page - half)
    const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES)
    if (end - start < MAX_VISIBLE_PAGES) {
      start = Math.max(0, end - MAX_VISIBLE_PAGES)
    }
    return Array.from({ length: end - start }, (_, i) => start + i)
  }

  return (
    <div className={styles.container}>
      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <div className={styles.tableCard}>
        {initialLoad ? (
          <div style={{ padding: 'var(--sp-6)' }}>
            <Skeleton height="300px" />
          </div>
        ) : (
          <>
            <div className={styles.tableWrap} style={{ position: 'relative' }}>
              {loading && <LoadingSpinner overlay />}
              <table className={styles.table}>
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
                    <tr className={styles.emptyRow}>
                      <td colSpan={10}>등록된 이미지가 없습니다.</td>
                    </tr>
                  ) : (
                    images.map((image) => (
                      <tr key={image.id}>
                        <td className={styles.tableSecondary} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {image.imageCode}
                        </td>
                        <td>
                          <img
                            src={image.fileUrl}
                            alt={image.originalFilename}
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                          />
                        </td>
                        <td className={styles.tableUsername}>
                          {image.originalFilename}
                        </td>
                        <td className={styles.tableSecondary}>
                          {image.targetLabel}
                        </td>
                        <td className={styles.tableSecondary}>
                          {image.uploaderUsername}
                        </td>
                        <td className={styles.tableSecondary}>
                          {formatFileSize(image.fileSize)}
                        </td>
                        <td className={styles.tableSecondary}>
                          {image.contentType}
                        </td>
                        <td className={styles.tableDate}>
                          {formatDateTime(image.createdDate)}
                        </td>
                        <td>
                          <span className="badge badge-success">활성</span>
                        </td>
                        <td>
                          {meRole === 'ADMIN' && (
                            <button
                              type="button"
                              className={styles.deleteButton}
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

            {totalPages > 1 && (
              <div className={styles.paginationBar}>
                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => handlePageChange(page - 1)}
                  disabled={loading || page === 0}
                >
                  이전
                </button>
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={
                      pageNum === page
                        ? styles.pageButtonActive
                        : styles.pageButton
                    }
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                  >
                    {pageNum + 1}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => handlePageChange(page + 1)}
                  disabled={loading || page >= totalPages - 1}
                >
                  다음
                </button>
              </div>
            )}
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
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <SuccessDialog
        isOpen={deleteSuccess}
        title="이미지가 삭제되었습니다"
        message="선택한 이미지를 삭제 처리했어요."
        onClose={() => setDeleteSuccess(false)}
      />
    </div>
  )
}
