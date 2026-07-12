import { useCallback, useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPost } from '../api/postApi'
import { uploadContentImage } from '../api/imageApi'
import { getMyProfile } from '../api/userApi'
import { ApiError } from '../api/ApiError'
import { useAuth } from '../context/AuthContext'
import { usePostList } from '../context/PostListContext'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { ImageBoxPicker } from '../components/post/ImageBoxPicker'
import type { UserDetailResponse } from '../types/user'
import styles from './PostCreatePage.module.css'

export function PostCreatePage() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const { resetAndRefresh } = usePostList()
  const handleLogout = useLogout()
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )

  useEffect(() => {
    let cancelled = false
    getMyProfile(token)
      .then((res) => {
        if (!cancelled) setMyProfile(res)
      })
      .catch((err) => handleUnauthorized(err))
    return () => {
      cancelled = true
    }
  }, [token, handleUnauthorized])

  const [body, setBody] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = body.trim().length > 0

  const addTag = (rawTag: string) => {
    const normalized = rawTag.trim().replace(/^#/, '').replace(/\s+/g, '')
    if (!normalized) return
    if (tags.includes(normalized)) return
    setTags((prev) => [...prev, normalized])
  }

  const handleTagKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    // 한글 IME 조합 중 Enter 입력 시 중복 태그가 생성되는 현상을 방지한다.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key !== 'Enter') return
    e.preventDefault()
    addTag(tagInput)
    setTagInput('')
  }

  const removeTag = (target: string) => {
    setTags((prev) => prev.filter((tag) => tag !== target))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const createdPost = await createPost(token, { body: body.trim(), tags })
      if (images.length > 0) {
        await Promise.all(images.map((file) => uploadContentImage(token, file, createdPost.id)))
      }
      // 게시글 목록 컨텍스트를 재조회하여 사용자가 수동 새로고침 없이 새 글을 보게 한다.
      resetAndRefresh()
      navigate('/app')
    } catch {
      setError('게시글 등록에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar role={myProfile?.role ?? null}
        onLogout={handleLogout} />
      <Header role={myProfile?.role ?? null}
        onLogout={handleLogout} />
      <main className={styles.main}>
        <div className={styles.formWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>게시글 작성</h1>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="post-body">
              내용
            </label>
            <textarea
              id="post-body"
              className={styles.bodyTextarea}
              placeholder="내용을 입력하세요..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>
          <div className={styles.fieldGroup}>
            <ImageBoxPicker images={images} onChange={setImages} disabled={submitting} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="post-tag-input">
              태그
            </label>
            <input
              id="post-tag-input"
              type="text"
              className={styles.tagInput}
              placeholder="태그 입력 후 Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              disabled={submitting}
            />
            {tags.length > 0 && (
              <div className={styles.tagChipList} aria-label="입력한 태그">
                {tags.map((tag) => (
                  <div key={tag} className={styles.tagChip}>
                    <span className={styles.tagChipText}>#{tag}</span>
                    <button
                      type="button"
                      className={styles.tagChipRemove}
                      onClick={() => removeTag(tag)}
                      disabled={submitting}
                      aria-label={`${tag} 태그 삭제`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || submitting}
            >
              {submitting ? '등록 중...' : '게시글 등록'}
            </button>
          </div>
        </form>
        </div>
      </main>
    </>
  )
}
