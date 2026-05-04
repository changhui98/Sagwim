import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/Navbar'
import { deletePost, getPost, toggleContentLike, updatePost } from '../api/postApi'
import { MenuMeatballsIcon } from '../components/NavIcons'
import { createComment, createReply, deleteComment, getComments, toggleCommentLike } from '../api/commentApi'
import { uploadCommentImage } from '../api/imageApi'
import { ApiError } from '../api/ApiError'
import type { ContentResponse } from '../types/post'
import type { CommentResponse } from '../types/comment'
import arrowCircleUpIcon from '../assets/arrow-circle-up-svgrepo-com.svg'
import pictureIcon from '../assets/picture-svgrepo-com.svg'
import styles from './PostDetailPage.module.css'

function formatRelativeTime(dateStr: string): string {
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return ''

  const diffMs = Date.now() - then
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return '방금'
  if (diffMin < 60) return `${diffMin}분`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간`

  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}일`
}

function getInitial(name: string | null | undefined): string {
  return (name?.trim().charAt(0) ?? '?').toUpperCase()
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return `${Math.floor(n / 1000)}K`
}

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const { token, meUsername, meNickname, meProfileImageUrl, meRole, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }
  const location = useLocation()

  const contentId = Number(postId)

  // 게시글 데이터: location.state로 넘어온 경우 우선 사용, 없으면 API 호출
  const passedPost = (location.state as { post?: ContentResponse } | null)?.post ?? null

  const [post, setPost] = useState<ContentResponse | null>(passedPost)
  const [postLoading, setPostLoading] = useState(passedPost === null)
  const [postError, setPostError] = useState<string | null>(null)

  const [liked, setLiked] = useState(() => passedPost?.likedByMe ?? false)
  const [likeCount, setLikeCount] = useState(() => passedPost?.likeCount ?? 0)
  const [likePending, setLikePending] = useState(false)
  const likeInFlightRef = useRef(false)
  const likedRef = useRef(liked)
  const likeCountRef = useRef(likeCount)

  const updateLiked = useCallback((next: boolean) => {
    likedRef.current = next
    setLiked(next)
  }, [])

  const updateLikeCount = useCallback((next: number) => {
    likeCountRef.current = next
    setLikeCount(next)
  }, [])

  // 게시글 로드 (passedPost가 없을 때)
  useEffect(() => {
    if (passedPost !== null || Number.isNaN(contentId)) return

    let cancelled = false
    setPostLoading(true)
    getPost(token, contentId)
      .then((data) => {
        if (cancelled) return
        setPost(data)
        setLiked(data.likedByMe ?? false)
        setLikeCount(data.likeCount ?? 0)
        likedRef.current = data.likedByMe ?? false
        likeCountRef.current = data.likeCount ?? 0
      })
      .catch((err) => {
        if (cancelled) return
        setPostError(err instanceof ApiError ? err.message : '게시글을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setPostLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, contentId, passedPost])

  const handleLikeClick = useCallback(async () => {
    if (likeInFlightRef.current) return
    likeInFlightRef.current = true

    const prevLiked = likedRef.current
    const prevCount = likeCountRef.current
    const nextLiked = !prevLiked
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1))

    updateLiked(nextLiked)
    updateLikeCount(nextCount)
    setLikePending(true)

    try {
      const res = await toggleContentLike(token, contentId)
      updateLiked(res.liked)
      updateLikeCount(res.likeCount)
    } catch (err) {
      updateLiked(prevLiked)
      updateLikeCount(prevCount)
      if (!(err instanceof ApiError)) {
        console.error('좋아요 처리 실패', err)
      }
    } finally {
      likeInFlightRef.current = false
      setLikePending(false)
    }
  }, [contentId, token, updateLiked, updateLikeCount])

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [editMode, setEditMode] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // ── 댓글 ──

  const [comments, setComments] = useState<CommentResponse[]>([])
  const [commentLikedMap, setCommentLikedMap] = useState<Record<number, boolean>>({})
  const [commentLikeCountMap, setCommentLikeCountMap] = useState<Record<number, number>>({})
  const commentLikeInFlightRef = useRef<Set<number>>(new Set())
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [nextCursorId, setNextCursorId] = useState<number | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadComments = useCallback(
    async (cursorId?: number) => {
      if (Number.isNaN(contentId)) return
      try {
        const data = await getComments(token, contentId, cursorId)
        setComments((prev) => (cursorId !== undefined ? [...prev, ...data.comments] : data.comments))
        // likeCountMap 초기화 (최초 로드 시만 overwrite, 커서 이후 로드는 merge)
        setCommentLikeCountMap((prev) => {
          const next = { ...prev }
          const allComments = cursorId !== undefined
            ? [...comments, ...data.comments]
            : data.comments
          for (const c of allComments) {
            if (!(c.id in next)) next[c.id] = c.likeCount
            for (const r of c.replies) {
              if (!(r.id in next)) next[r.id] = r.likeCount
            }
          }
          return next
        })
        // likedMap 초기화 (서버에서 내려온 likedByMe 값을 기준으로 세팅, 토글 이후 값은 유지)
        setCommentLikedMap((prev) => {
          const next = { ...prev }
          const allComments = cursorId !== undefined
            ? [...comments, ...data.comments]
            : data.comments
          for (const c of allComments) {
            if (!(c.id in next)) next[c.id] = c.likedByMe ?? false
            for (const r of c.replies) {
              if (!(r.id in next)) next[r.id] = r.likedByMe ?? false
            }
          }
          return next
        })
        setNextCursorId(data.nextCursorId)
        setHasNext(data.hasNext)
      } catch (err) {
        setCommentsError(err instanceof ApiError ? err.message : '댓글을 불러오지 못했습니다.')
      }
    },
    [token, contentId],
  )

  useEffect(() => {
    setCommentsLoading(true)
    loadComments().finally(() => setCommentsLoading(false))
  }, [loadComments])

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleLoadMore = async () => {
    if (!hasNext || nextCursorId === null) return
    setLoadingMore(true)
    await loadComments(nextCursorId)
    setLoadingMore(false)
  }

  // ── 댓글 입력 ──

  const [commentBody, setCommentBody] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const commentImageInputRef = useRef<HTMLInputElement>(null)
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null)
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null)

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCommentImageFile(file)
    setCommentImagePreview(URL.createObjectURL(file))
  }

  const handleCommentImageRemove = () => {
    setCommentImageFile(null)
    setCommentImagePreview(null)
    if (commentImageInputRef.current) commentImageInputRef.current.value = ''
  }

  const handleCommentSubmit = async () => {
    const trimmed = commentBody.trim()
    if (!trimmed || commentSubmitting) return

    setCommentSubmitting(true)
    try {
      let imageUrl: string | undefined
      if (commentImageFile) {
        const uploaded = await uploadCommentImage(token, commentImageFile, `temp-${Date.now()}`)
        imageUrl = uploaded.fileUrl
      }
      const created = await createComment(token, contentId, trimmed, imageUrl)
      setComments((prev) => [created, ...prev])
      setCommentBody('')
      setCommentImageFile(null)
      setCommentImagePreview(null)
      if (commentImageInputRef.current) commentImageInputRef.current.value = ''
      commentInputRef.current?.focus()
    } catch (err) {
      if (!(err instanceof ApiError)) {
        console.error('댓글 작성 실패', err)
      }
    } finally {
      setCommentSubmitting(false)
    }
  }


  // ── 대댓글 ──

  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)

  const handleReplySubmit = async (commentId: number) => {
    const trimmed = replyBody.trim()
    if (!trimmed || replySubmitting) return

    setReplySubmitting(true)
    try {
      const created = await createReply(token, contentId, commentId, trimmed)
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, replies: [...c.replies, created] } : c,
        ),
      )
      setReplyBody('')
      setReplyingToId(null)
    } catch (err) {
      if (!(err instanceof ApiError)) {
        console.error('대댓글 작성 실패', err)
      }
    } finally {
      setReplySubmitting(false)
    }
  }

  // ── 댓글 삭제 ──

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(token, contentId, commentId)
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              deleted: true,
              authorUsername: null,
              authorNickname: null,
              body: '삭제된 댓글입니다.',
            }
          }
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? { ...r, deleted: true, authorUsername: null, authorNickname: null, body: '삭제된 댓글입니다.' }
                : r
            ),
          }
        }),
      )
    } catch (err) {
      if (!(err instanceof ApiError)) {
        console.error('댓글 삭제 실패', err)
      }
    }
  }

  const handleCommentLike = async (commentId: number) => {
    if (commentLikeInFlightRef.current.has(commentId)) return
    commentLikeInFlightRef.current.add(commentId)

    const prevLiked = commentLikedMap[commentId] ?? false
    const prevCount = commentLikeCountMap[commentId] ?? 0
    const nextLiked = !prevLiked
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1))

    setCommentLikedMap((prev) => ({ ...prev, [commentId]: nextLiked }))
    setCommentLikeCountMap((prev) => ({ ...prev, [commentId]: nextCount }))

    try {
      const res = await toggleCommentLike(token, commentId)
      setCommentLikedMap((prev) => ({ ...prev, [commentId]: res.liked }))
      setCommentLikeCountMap((prev) => ({ ...prev, [commentId]: res.likeCount }))
    } catch {
      setCommentLikedMap((prev) => ({ ...prev, [commentId]: prevLiked }))
      setCommentLikeCountMap((prev) => ({ ...prev, [commentId]: prevCount }))
    } finally {
      commentLikeInFlightRef.current.delete(commentId)
    }
  }

  const handleEditStart = () => {
    setEditBody(post?.body ?? '')
    setEditMode(true)
    setMenuOpen(false)
  }

  const handleEditCancel = () => {
    setEditMode(false)
    setEditBody('')
  }

  const handleEditSubmit = async () => {
    const trimmed = editBody.trim()
    if (!trimmed || editSubmitting || !post) return
    setEditSubmitting(true)
    try {
      const updated = await updatePost(token, contentId, trimmed, post.tags)
      setPost(updated)
      setEditMode(false)
      setEditBody('')
    } catch (err) {
      if (!(err instanceof ApiError)) console.error('게시글 수정 실패', err)
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return
    try {
      await deletePost(token, contentId)
      navigate(-1)
    } catch (err) {
      if (!(err instanceof ApiError)) console.error('게시글 삭제 실패', err)
    }
  }

  if (postLoading) {
    return (
      <>
        <Navbar role={meRole} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={styles.page}>
            <div className={styles.post}>
              <div className={styles.header}>
                <div className={styles.avatar} style={{ background: 'var(--clr-surface-3)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div className={styles.skeletonLine} style={{ width: '30%' }} />
                  <div className={styles.skeletonLine} style={{ width: '15%' }} />
                </div>
              </div>
              <div className={styles.skeletonLine} style={{ width: '100%', height: 18 }} />
              <div className={styles.skeletonLine} style={{ width: '80%', height: 18 }} />
              <div className={styles.skeletonLine} style={{ width: '60%', height: 18 }} />
            </div>
          </div>
        </main>
      </>
    )
  }

  if (postError || !post) {
    return (
      <>
        <Navbar role={meRole} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={styles.page}>
            <div className={styles.errorBanner}>
              {postError ?? '게시글을 찾을 수 없습니다.'}
            </div>
            <button
              type="button"
              className={styles.loadMoreBtn}
              style={{ marginTop: 'var(--sp-4)' }}
              onClick={() => navigate(-1)}
            >
              돌아가기
            </button>
          </div>
        </main>
      </>
    )
  }

  const displayName = post.nickname?.trim() || post.createdBy
  const profilePath = `/app/profile/${encodeURIComponent(post.createdBy)}`
  const isMine = !!meUsername && post.createdBy === meUsername
  const avatarUrl = isMine ? meProfileImageUrl : null
  const tags = post.tags?.filter((t) => t.trim().length > 0) ?? []
  const meDisplayName = meNickname?.trim() || meUsername || ''
  const commentCount = comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0)

  // 상위 3개(좋아요 많은 순, 동점 시 최신순) + 나머지(최신순)
  const topComments = [...comments]
    .filter((c) => !c.deleted && (commentLikeCountMap[c.id] ?? c.likeCount) > 0)
    .sort((a, b) => {
      const likeA = commentLikeCountMap[a.id] ?? a.likeCount
      const likeB = commentLikeCountMap[b.id] ?? b.likeCount
      if (likeB !== likeA) return likeB - likeA
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 3)
  const topIds = new Set(topComments.map((c) => c.id))
  const restComments = comments
    .filter((c) => !topIds.has(c.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const displayComments = [...topComments, ...restComments]

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <main className={styles.main}>
      <div className={styles.page}>
      <article className={styles.post}>
        <div className={styles.header}>
          <Link to={profilePath} aria-label={`${displayName} 프로필 보기`}>
            {avatarUrl ? (
              <div className={styles.avatar}>
                <img src={avatarUrl} alt="" className={styles.avatarImg} />
              </div>
            ) : (
              <div className={styles.avatar}>{getInitial(displayName)}</div>
            )}
          </Link>
          <div className={styles.headerInfo}>
            <Link to={profilePath} className={styles.authorName}>
              {displayName}
            </Link>
            <time className={styles.date} dateTime={post.createdAt}>
              {formatRelativeTime(post.createdAt)}
            </time>
          </div>
          {isMine && (
            <div className={styles.postMenu} ref={menuRef}>
              <button
                type="button"
                className={styles.postMenuBtn}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="게시글 메뉴"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <MenuMeatballsIcon width={20} height={20} />
              </button>
              {menuOpen && (
                <div className={styles.postMenuPopover} role="menu">
                  <button
                    type="button"
                    className={styles.postMenuItem}
                    role="menuitem"
                    onClick={handleEditStart}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className={`${styles.postMenuItem} ${styles.postMenuItemDanger}`}
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); void handleDeletePost() }}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {editMode ? (
          <div className={styles.editArea}>
            <textarea
              className={styles.editTextarea}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={6}
              autoFocus
              aria-label="게시글 수정"
            />
            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.editCancelBtn}
                onClick={handleEditCancel}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.editSubmitBtn}
                disabled={!editBody.trim() || editSubmitting}
                onClick={() => void handleEditSubmit()}
              >
                {editSubmitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.body}>{post.body}</p>
        )}

        {tags.length > 0 && (
          <div className={styles.tagChipList} aria-label="태그">
            {tags.map((tag) => (
              <span key={tag} className={styles.tagChip}>{tag}</span>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
            onClick={handleLikeClick}
            disabled={likePending}
            aria-label={liked ? '좋아요 취소' : '좋아요'}
            aria-pressed={liked}
          >
            <HeartIcon filled={liked} className={styles.icon} />
            <span className={styles.count}>{formatCount(likeCount)}</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            aria-label="댓글"
            onClick={() => commentInputRef.current?.focus()}
          >
            <CommentIcon className={styles.icon} />
            <span className={styles.count}>{formatCount(commentCount)}</span>
          </button>
        </div>
      </article>

      <div className={styles.divider} />

      <section className={styles.commentSection} aria-label="댓글">
        {/* 댓글 입력 */}
        <div className={styles.inputRow}>
          <div className={styles.avatar} aria-hidden="true">
            {meDisplayName ? getInitial(meDisplayName) : '?'}
          </div>
          <div className={styles.inputArea}>
            <input
              ref={commentInputRef}
              type="text"
              className={styles.commentInput}
              placeholder={`${meDisplayName}님에게 답글 남기기...`}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  void handleCommentSubmit()
                }
              }}
              aria-label="댓글 입력"
            />
            {commentBody.trim() ? (
              <button
                type="button"
                className={styles.iconBtn}
                disabled={commentSubmitting}
                onClick={() => void handleCommentSubmit()}
                aria-label="댓글 전송"
              >
                <img src={arrowCircleUpIcon} alt="" className={styles.iconBtnImg} />
              </button>
            ) : (
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="사진 첨부"
                onClick={() => commentImageInputRef.current?.click()}
              >
                <img src={pictureIcon} alt="" className={styles.iconBtnImg} />
              </button>
            )}
          </div>
          <input
            ref={commentImageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleCommentImageSelect}
          />
        </div>
        {commentImagePreview && (
          <div className={styles.commentImagePreview}>
            <img src={commentImagePreview} alt="첨부 이미지" className={styles.commentImagePreviewImg} />
            <button
              type="button"
              className={styles.commentImageRemoveBtn}
              onClick={handleCommentImageRemove}
              aria-label="이미지 제거"
            >
              &#x2715;
            </button>
          </div>
        )}

        {/* 댓글 목록 */}
        {commentsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className={styles.commentRow}>
                <div
                  className={styles.commentAvatar}
                  style={{ background: 'var(--clr-surface-3)' }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className={styles.skeletonLine} style={{ width: '25%' }} />
                  <div className={styles.skeletonLine} style={{ width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : commentsError ? (
          <div className={styles.errorBanner}>{commentsError}</div>
        ) : comments.length === 0 ? (
          <p className={styles.emptyComment}>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
        ) : (
          <div className={styles.commentList} role="list">
            {displayComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                contentId={contentId}
                meUsername={meUsername}
                liked={commentLikedMap[comment.id] ?? false}
                likeCount={commentLikeCountMap[comment.id] ?? comment.likeCount}
                commentLikedMap={commentLikedMap}
                commentLikeCountMap={commentLikeCountMap}
                replyingToId={replyingToId}
                replyBody={replyBody}
                replySubmitting={replySubmitting}
                onReplyToggle={(id) =>
                  setReplyingToId((prev) => (prev === id ? null : id))
                }
                onReplyBodyChange={setReplyBody}
                onReplySubmit={handleReplySubmit}
                onDelete={handleDeleteComment}
                onLike={handleCommentLike}
              />
            ))}
          </div>
        )}

        {hasNext && (
          <button
            type="button"
            className={styles.loadMoreBtn}
            disabled={loadingMore}
            onClick={() => void handleLoadMore()}
          >
            {loadingMore ? '불러오는 중...' : '더보기 ...'}
          </button>
        )}
      </section>
      </div>
      </main>
    </>
  )
}

// ── CommentItem ──

interface CommentItemProps {
  comment: CommentResponse
  contentId: number
  meUsername: string | null
  liked: boolean
  likeCount: number
  commentLikedMap: Record<number, boolean>
  commentLikeCountMap: Record<number, number>
  replyingToId: number | null
  replyBody: string
  replySubmitting: boolean
  onReplyToggle: (id: number) => void
  onReplyBodyChange: (val: string) => void
  onReplySubmit: (commentId: number) => Promise<void>
  onDelete: (commentId: number) => Promise<void>
  onLike: (commentId: number) => void
}

function CommentItem({
  comment,
  meUsername,
  liked,
  likeCount,
  commentLikedMap,
  commentLikeCountMap,
  replyingToId,
  replyBody,
  replySubmitting,
  onReplyToggle,
  onReplyBodyChange,
  onReplySubmit,
  onDelete,
  onLike,
}: CommentItemProps) {
  const isReplying = replyingToId === comment.id
  const replyInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isReplying) {
      replyInputRef.current?.focus()
    }
  }, [isReplying])

  const authorLabel = comment.deleted
    ? '알 수 없음'
    : (comment.authorNickname ?? '알 수 없음')

  const hasReplies = comment.replies.length > 0

  return (
    <div className={styles.commentThread} role="listitem">
      {/* 부모 댓글 행 */}
      <div className={styles.commentRow}>
        <div className={styles.avatarCol}>
          <div className={`${styles.commentAvatar} ${comment.deleted ? styles.deleted : ''}`}>
            {!comment.deleted && comment.authorProfileImageUrl ? (
              <img src={comment.authorProfileImageUrl} alt="" className={styles.avatarImg} />
            ) : (
              comment.deleted ? '?' : getInitial(comment.authorNickname)
            )}
          </div>
          {(hasReplies || isReplying) && <div className={styles.avatarLine} />}
        </div>
        <div className={styles.commentContent}>
          <div className={styles.commentMeta}>
            <span className={`${styles.commentAuthor} ${comment.deleted ? styles.deleted : ''}`}>
              {authorLabel}
            </span>
            <time className={styles.commentDate} dateTime={comment.createdAt}>
              {formatRelativeTime(comment.createdAt)}
            </time>
          </div>
          <p className={`${styles.commentText} ${comment.deleted ? styles.deleted : ''}`}>
            {comment.body}
          </p>
          {!comment.deleted && comment.imageUrl && (
            <img src={comment.imageUrl} alt="첨부 이미지" className={styles.commentImg} />
          )}
          {!comment.deleted && (
            <div className={styles.commentActions}>
              <button
                type="button"
                className={`${styles.commentActionBtn} ${liked ? styles.commentLiked : ''}`}
                onClick={() => onLike(comment.id)}
                aria-label={liked ? '좋아요 취소' : '좋아요'}
                aria-pressed={liked}
              >
                <CommentHeartIcon filled={liked} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              <button
                type="button"
                className={styles.commentActionBtn}
                onClick={() => onReplyToggle(comment.id)}
                aria-label="답글 달기"
              >
                답글
              </button>
              {meUsername && comment.authorUsername === meUsername && (
                <button
                  type="button"
                  className={`${styles.commentActionBtn} ${styles.danger}`}
                  onClick={() => void onDelete(comment.id)}
                  aria-label="댓글 삭제"
                >
                  삭제
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 대댓글 입력창 */}
      {isReplying && (
        <div className={styles.commentRow}>
          <div className={styles.avatarCol}>
            <div className={styles.replyAvatar}>{getInitial(meUsername)}</div>
            {hasReplies && <div className={styles.avatarLine} />}
          </div>
          <div className={styles.replyInputArea}>
            <input
              ref={replyInputRef}
              type="text"
              className={styles.replyInput}
              placeholder="답글 입력..."
              value={replyBody}
              onChange={(e) => onReplyBodyChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  void onReplySubmit(comment.id)
                }
                if (e.key === 'Escape') {
                  onReplyToggle(comment.id)
                }
              }}
              aria-label="답글 입력"
            />
            <button
              type="button"
              className={styles.submitBtn}
              disabled={!replyBody.trim() || replySubmitting}
              onClick={() => void onReplySubmit(comment.id)}
              aria-label="답글 전송"
            >
              전송
            </button>
          </div>
        </div>
      )}

      {/* 대댓글 목록 (플랫하게, 부모와 같은 레벨) */}
      {comment.replies.map((reply, idx) => {
        const isLastReply = idx === comment.replies.length - 1
        const showReplyLine = !isLastReply || isReplying
        return (
          <div className={styles.commentRow} key={reply.id}>
            <div className={styles.avatarCol}>
              <div className={`${styles.replyAvatar} ${reply.deleted ? styles.deleted : ''}`}>
                {!reply.deleted && reply.authorProfileImageUrl ? (
                  <img src={reply.authorProfileImageUrl} alt="" className={styles.avatarImg} />
                ) : (
                  reply.deleted ? '?' : getInitial(reply.authorNickname)
                )}
              </div>
              {showReplyLine && <div className={styles.avatarLine} />}
            </div>
            <div className={styles.commentContent}>
              <div className={styles.commentMeta}>
                <span className={`${styles.commentAuthor} ${reply.deleted ? styles.deleted : ''}`}>
                  {reply.deleted ? '알 수 없음' : (reply.authorNickname ?? '알 수 없음')}
                </span>
                <time className={styles.commentDate} dateTime={reply.createdAt}>
                  {formatRelativeTime(reply.createdAt)}
                </time>
              </div>
              <p className={`${styles.commentText} ${reply.deleted ? styles.deleted : ''}`}>
                {reply.body}
              </p>
              {!reply.deleted && reply.imageUrl && (
                <img src={reply.imageUrl} alt="첨부 이미지" className={styles.commentImg} />
              )}
              {!reply.deleted && (
                <div className={styles.commentActions}>
                  <button
                    type="button"
                    className={`${styles.commentActionBtn} ${(commentLikedMap[reply.id] ?? false) ? styles.commentLiked : ''}`}
                    onClick={() => onLike(reply.id)}
                    aria-label={(commentLikedMap[reply.id] ?? false) ? '좋아요 취소' : '좋아요'}
                    aria-pressed={commentLikedMap[reply.id] ?? false}
                  >
                    <CommentHeartIcon filled={commentLikedMap[reply.id] ?? false} />
                    {(commentLikeCountMap[reply.id] ?? reply.likeCount) > 0 && (
                      <span>{commentLikeCountMap[reply.id] ?? reply.likeCount}</span>
                    )}
                  </button>
                  {meUsername && reply.authorUsername === meUsername && (
                    <button
                      type="button"
                      className={`${styles.commentActionBtn} ${styles.danger}`}
                      onClick={() => void onDelete(reply.id)}
                      aria-label="댓글 삭제"
                    >
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── 아이콘 ──

interface IconProps extends React.SVGProps<SVGSVGElement> {
  filled?: boolean
}

function HeartIcon({ filled = false, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
      {...props}
    >
      <path d="M12 20.5s-7.5-4.6-7.5-10a4.5 4.5 0 0 1 8-2.9 4.5 4.5 0 0 1 8 2.9c0 5.4-7.5 10-7.5 10h-1z" />
    </svg>
  )
}

function CommentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
      {...props}
    >
      <path d="M21 12a8 8 0 0 1-11.6 7.2L4 20l.9-4.2A8 8 0 1 1 21 12z" />
    </svg>
  )
}

function CommentHeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
    >
      <path d="M12 20.5s-7.5-4.6-7.5-10a4.5 4.5 0 0 1 8-2.9 4.5 4.5 0 0 1 8 2.9c0 5.4-7.5 10-7.5 10h-1z" />
    </svg>
  )
}
