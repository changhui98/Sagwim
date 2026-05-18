import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { deletePost, getPost, toggleContentLike, updatePost } from '../api/postApi'
import { MeatballMenu } from '../components/common/MeatballMenu'
import { ReportModal } from '../components/common/ReportModal'
import { createComment, createReply, deleteComment, getComments, toggleCommentLike, updateComment } from '../api/commentApi'
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
  const { token, meUsername, meNickname, meProfileImageUrl, meRole } = useAuth()
  const navigate = useNavigate()
  const handleLogout = useLogout()
  const location = useLocation()

  const contentId = Number(postId)

  // 게시글 데이터: location.state로 넘어온 경우 우선 사용, 없으면 API 호출
  const locationState = location.state as { post?: ContentResponse; editMode?: boolean } | null
  const passedPost = locationState?.post ?? null
  const passedEditMode = locationState?.editMode ?? false

  const [post, setPost] = useState<ContentResponse | null>(passedPost)
  const [postLoading, setPostLoading] = useState(passedPost === null)
  const [postError, setPostError] = useState<string | null>(null)

  // 신고 모달 상태: { targetType, targetId }
  const [reportTarget, setReportTarget] = useState<{ targetType: 'POST' | 'COMMENT'; targetId: number } | null>(null)

  const [liked, setLiked] = useState(() => passedPost?.likedByMe ?? false)
  const [likeCount, setLikeCount] = useState(() => passedPost?.likeCount ?? 0)
  const [likePending, setLikePending] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
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

  // post가 교체될 때(API 재로드 등) 슬라이드 인덱스를 초기화한다.
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [post?.id])

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

  const [editMode, setEditMode] = useState(passedEditMode)
  // passedEditMode가 true일 때 passedPost.body를 초기값으로 사용
  const [editBody, setEditBody] = useState(() => (passedEditMode ? (passedPost?.body ?? '') : ''))
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
  // blob URL 누수 방지: 최신 preview URL을 ref로 추적하여 unmount 시 revoke
  const commentImagePreviewRef = useRef<string | null>(null)

  useEffect(() => {
    commentImagePreviewRef.current = commentImagePreview
  }, [commentImagePreview])

  // 컴포넌트 unmount 시 미해제된 blob URL 정리
  useEffect(() => {
    return () => {
      if (commentImagePreviewRef.current) {
        URL.revokeObjectURL(commentImagePreviewRef.current)
      }
    }
  }, [])

  // ── 대댓글 ──

  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [replyBody, setReplyBody] = useState('')

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // 기존 preview가 있으면 먼저 해제
    if (commentImagePreviewRef.current) {
      URL.revokeObjectURL(commentImagePreviewRef.current)
    }
    const newUrl = URL.createObjectURL(file)
    setCommentImageFile(file)
    setCommentImagePreview(newUrl)
  }

  const handleCommentImageRemove = () => {
    if (commentImagePreviewRef.current) {
      URL.revokeObjectURL(commentImagePreviewRef.current)
    }
    setCommentImageFile(null)
    setCommentImagePreview(null)
    if (commentImageInputRef.current) commentImageInputRef.current.value = ''
  }

  const handleCommentSubmit = async () => {
    const trimmed = commentBody.trim()
    if (!trimmed || commentSubmitting) return

    setCommentSubmitting(true)
    try {
      // 일반 댓글 전송
      let imageUrl: string | undefined
      if (commentImageFile) {
        const uploaded = await uploadCommentImage(token, commentImageFile, `temp-${Date.now()}`)
        imageUrl = uploaded.fileUrl
      }
      const created = await createComment(token, contentId, trimmed, imageUrl)
      setComments((prev) => [created, ...prev])
      // 전송 성공 시 blob URL 해제
      if (commentImagePreviewRef.current) {
        URL.revokeObjectURL(commentImagePreviewRef.current)
      }
      setCommentImageFile(null)
      setCommentImagePreview(null)
      if (commentImageInputRef.current) commentImageInputRef.current.value = ''
      setCommentBody('')
      commentInputRef.current?.focus()
    } catch (err) {
      if (!(err instanceof ApiError)) {
        console.error('댓글 작성 실패', err)
      }
    } finally {
      setCommentSubmitting(false)
    }
  }

  const handleReplySubmit = async (parentCommentId: number) => {
    const trimmed = replyBody.trim()
    if (!trimmed || commentSubmitting) return

    setCommentSubmitting(true)
    try {
      const created = await createReply(token, contentId, parentCommentId, trimmed)
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentCommentId ? { ...c, replies: [...c.replies, created] } : c,
        ),
      )
      setReplyBody('')
      setReplyingToId(null)
    } catch (err) {
      if (!(err instanceof ApiError)) {
        console.error('답글 작성 실패', err)
      }
    } finally {
      setCommentSubmitting(false)
    }
  }


  // ── 댓글 수정 ──

  const handleUpdateComment = async (commentId: number, newBody: string) => {
    try {
      const updated = await updateComment(token, contentId, commentId, newBody)
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) return { ...c, body: updated.body }
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId ? { ...r, body: updated.body } : r,
            ),
          }
        }),
      )
    } catch (err) {
      if (!(err instanceof ApiError)) {
        console.error('댓글 수정 실패', err)
      }
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
      const refreshed = await updatePost(token, contentId, trimmed, post.tags)
      setPost(refreshed)
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
          <div className={styles.menuWrap}>
            <MeatballMenu
              ariaLabel="게시글 메뉴"
              iconSize={20}
              size="md"
              items={
                isMine
                  ? [
                      { label: '수정', onClick: handleEditStart },
                      { label: '삭제', danger: true, onClick: () => void handleDeletePost() },
                    ]
                  : [
                      { label: '신고하기', danger: true, onClick: () => setReportTarget({ targetType: 'POST', targetId: contentId }) },
                    ]
              }
            />
          </div>
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

        {(post.imageUrls ?? []).length > 0 && (() => {
          const imageUrls = post.imageUrls!
          return (
            <div className={styles.imageWrap}>
              <img
                src={imageUrls[currentImageIndex]}
                alt={`게시글 첨부 이미지 ${currentImageIndex + 1}`}
                className={styles.image}
              />
              {imageUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    className={`${styles.slideBtn} ${styles.slideBtnPrev}`}
                    aria-label="이전 이미지"
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? imageUrls.length - 1 : prev - 1,
                      )
                    }
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={`${styles.slideBtn} ${styles.slideBtnNext}`}
                    aria-label="다음 이미지"
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === imageUrls.length - 1 ? 0 : prev + 1,
                      )
                    }
                  >
                    ›
                  </button>
                  <div className={styles.indicators}>
                    {imageUrls.map((_, index) => (
                      <span
                        key={index}
                        className={`${styles.dot} ${index === currentImageIndex ? styles.dotActive : ''}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })()}

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
            {meProfileImageUrl ? (
              <img src={meProfileImageUrl} alt="" className={styles.avatarImg} />
            ) : (
              meDisplayName ? getInitial(meDisplayName) : '?'
            )}
          </div>
          <div className={styles.inputArea}>
            <input
              ref={commentInputRef}
              type="text"
              className={styles.commentInput}
              placeholder={`${meDisplayName}님의 생각을 댓글로 남겨보세요...`}
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
            <div className={styles.iconBtnWrap}>
              {/* 전송 버튼: 텍스트 있을 때 fade-in + scale-up */}
              <button
                type="button"
                className={`${styles.iconBtn}${!commentBody.trim() ? ` ${styles.iconBtnHidden}` : ''}`}
                disabled={commentSubmitting || !commentBody.trim()}
                onClick={() => void handleCommentSubmit()}
                aria-label="댓글 전송"
                tabIndex={commentBody.trim() ? 0 : -1}
              >
                <img src={arrowCircleUpIcon} alt="" className={styles.iconBtnImgSend} />
              </button>
              {/* 이미지 첨부 버튼: 텍스트 없을 때 fade-in + scale-up */}
              <button
                type="button"
                className={`${styles.iconBtn}${commentBody.trim() ? ` ${styles.iconBtnHidden}` : ''}`}
                aria-label="사진 첨부"
                onClick={() => commentImageInputRef.current?.click()}
                tabIndex={commentBody.trim() ? -1 : 0}
              >
                <img src={pictureIcon} alt="" className={styles.iconBtnImgPicture} />
              </button>
            </div>
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
                meDisplayName={meDisplayName}
                meProfileImageUrl={meProfileImageUrl}
                isCurrentUserPostAuthor={!!meUsername && post.createdBy === meUsername}
                postAuthorNickname={displayName}
                postAuthorProfileImageUrl={isMine ? meProfileImageUrl : null}
                liked={commentLikedMap[comment.id] ?? false}
                likeCount={commentLikeCountMap[comment.id] ?? comment.likeCount}
                commentLikedMap={commentLikedMap}
                commentLikeCountMap={commentLikeCountMap}
                replyingToId={replyingToId}
                replyBody={replyBody}
                replySubmitting={commentSubmitting}
                onReplyBodyChange={setReplyBody}
                onReplySubmit={handleReplySubmit}
                onReplyToggle={(id) => {
                  const isTogglingOn = replyingToId !== id
                  setReplyingToId(isTogglingOn ? id : null)
                  if (!isTogglingOn) setReplyBody('')
                }}
                onDelete={handleDeleteComment}
                onLike={handleCommentLike}
                onUpdate={handleUpdateComment}
                onReport={(commentId) => setReportTarget({ targetType: 'COMMENT', targetId: commentId })}
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

      <ReportModal
        open={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        targetType={reportTarget?.targetType ?? 'POST'}
        targetId={reportTarget?.targetId ?? 0}
      />
    </>
  )
}

// ── CommentItem ──

interface CommentItemProps {
  comment: CommentResponse
  contentId: number
  meUsername: string | null
  meDisplayName: string
  meProfileImageUrl: string | null
  isCurrentUserPostAuthor: boolean
  postAuthorNickname: string
  postAuthorProfileImageUrl: string | null
  liked: boolean
  likeCount: number
  commentLikedMap: Record<number, boolean>
  commentLikeCountMap: Record<number, number>
  replyingToId: number | null
  replyBody: string
  replySubmitting: boolean
  onReplyBodyChange: (value: string) => void
  onReplySubmit: (parentCommentId: number) => Promise<void>
  onReplyToggle: (id: number) => void
  onDelete: (commentId: number) => Promise<void>
  onLike: (commentId: number) => void
  onUpdate: (commentId: number, newBody: string) => Promise<void>
  onReport: (commentId: number) => void
}

function CommentItem({
  comment,
  meUsername,
  meDisplayName,
  meProfileImageUrl,
  isCurrentUserPostAuthor,
  postAuthorNickname,
  postAuthorProfileImageUrl,
  liked,
  likeCount,
  commentLikedMap,
  commentLikeCountMap,
  replyingToId,
  replyBody,
  replySubmitting,
  onReplyBodyChange,
  onReplySubmit,
  onReplyToggle,
  onDelete,
  onLike,
  onUpdate,
  onReport,
}: CommentItemProps) {
  // 댓글 인라인 수정 상태
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editBody, setEditBody] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const isMyComment = !!meUsername && comment.authorUsername === meUsername

  const authorLabel = comment.deleted
    ? '알 수 없음'
    : (comment.authorNickname ?? '알 수 없음')

  const hasReplies = comment.replies.length > 0

  const handleEditStart = (targetId: number, currentBody: string) => {
    setEditingCommentId(targetId)
    setEditBody(currentBody)
  }

  const handleEditCancel = () => {
    setEditingCommentId(null)
    setEditBody('')
  }

  const handleEditSubmit = async (targetId: number) => {
    const trimmed = editBody.trim()
    if (!trimmed || editSubmitting) return
    setEditSubmitting(true)
    try {
      await onUpdate(targetId, trimmed)
      setEditingCommentId(null)
      setEditBody('')
    } finally {
      setEditSubmitting(false)
    }
  }

  // 게시글 작성자 좋아요 아바타: likedByPostAuthor가 true일 때만 표시
  // 현재 로그인 사용자가 게시글 작성자인 경우 commentLikedMap(실시간)을 우선 참조
  // 아바타에는 댓글 작성자가 아닌 게시글 작성자(post author)의 프로필을 표시
  const renderPostAuthorLikeAvatar = (target: typeof comment) => {
    const showPostAuthorLike = isCurrentUserPostAuthor
      ? (commentLikedMap[target.id] ?? false)
      : (target.likedByPostAuthor ?? false)
    if (!showPostAuthorLike) return null
    return (
      <div className={styles.postAuthorLikeWrapper} aria-label="게시글 작성자가 좋아요 누름">
        <div className={styles.postAuthorLikeAvatar}>
          {postAuthorProfileImageUrl ? (
            <img src={postAuthorProfileImageUrl} alt="" className={styles.avatarImg} />
          ) : (
            getInitial(postAuthorNickname)
          )}
        </div>
        <span className={styles.postAuthorLikeHeart} aria-hidden>❤</span>
      </div>
    )
  }

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
          {hasReplies && <div className={styles.avatarLine} />}
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

          {/* 수정 모드 */}
          {editingCommentId === comment.id ? (
            <div className={styles.commentEditArea}>
              <textarea
                className={styles.commentEditTextarea}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                autoFocus
                aria-label="댓글 수정"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleEditCancel()
                }}
              />
              <div className={styles.commentEditActions}>
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
                  onClick={() => void handleEditSubmit(comment.id)}
                >
                  {editSubmitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={`${styles.commentText} ${comment.deleted ? styles.deleted : ''}`}>
                {comment.body}
              </p>
              {!comment.deleted && comment.imageUrl && (
                <img src={comment.imageUrl} alt="첨부 이미지" className={styles.commentImg} />
              )}
            </>
          )}

          {!comment.deleted && editingCommentId !== comment.id && (
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
                className={`${styles.commentActionBtn} ${replyingToId === comment.id ? styles.commentLiked : ''}`}
                onClick={() => onReplyToggle(comment.id)}
                aria-label="답글 달기"
                aria-pressed={replyingToId === comment.id}
              >
                답글
              </button>
            </div>
          )}
        </div>

        {/* 오른쪽 영역: 게시글 작성자 좋아요 아바타 + 미트볼 메뉴 */}
        {!comment.deleted && (
          <div className={styles.commentTrailing}>
            {renderPostAuthorLikeAvatar(comment)}
            <MeatballMenu
              ariaLabel="댓글 메뉴"
              iconSize={16}
              size="sm"
              items={
                isMyComment
                  ? [
                      { label: '수정', onClick: () => handleEditStart(comment.id, comment.body) },
                      { label: '삭제', danger: true, onClick: () => void onDelete(comment.id) },
                    ]
                  : [
                      { label: '신고하기', danger: true, onClick: () => onReport(comment.id) },
                    ]
              }
            />
          </div>
        )}
      </div>

      {/* 대댓글 목록 (플랫하게, 부모와 같은 레벨) */}
      {comment.replies.map((reply, idx) => {
        const isLastReply = idx === comment.replies.length - 1
        // 입력창이 표시될 때는 마지막 답글에도 세로선을 유지
        const showReplyLine = !isLastReply || replyingToId === comment.id
        const isMyReply = !!meUsername && reply.authorUsername === meUsername
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

              {/* 대댓글 수정 모드 */}
              {editingCommentId === reply.id ? (
                <div className={styles.commentEditArea}>
                  <textarea
                    className={styles.commentEditTextarea}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    autoFocus
                    aria-label="댓글 수정"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') handleEditCancel()
                    }}
                  />
                  <div className={styles.commentEditActions}>
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
                      onClick={() => void handleEditSubmit(reply.id)}
                    >
                      {editSubmitting ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className={`${styles.commentText} ${reply.deleted ? styles.deleted : ''}`}>
                    {reply.body}
                  </p>
                  {!reply.deleted && reply.imageUrl && (
                    <img src={reply.imageUrl} alt="첨부 이미지" className={styles.commentImg} />
                  )}
                </>
              )}

              {!reply.deleted && editingCommentId !== reply.id && (
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
                </div>
              )}
            </div>

            {/* 대댓글 오른쪽: 게시글 작성자 좋아요 아바타 + 미트볼 메뉴 */}
            {!reply.deleted && (
              <div className={styles.commentTrailing}>
                {renderPostAuthorLikeAvatar(reply)}
                <MeatballMenu
                  ariaLabel="댓글 메뉴"
                  iconSize={16}
                  size="sm"
                  items={
                    isMyReply
                      ? [
                          { label: '수정', onClick: () => handleEditStart(reply.id, reply.body) },
                          { label: '삭제', danger: true, onClick: () => void onDelete(reply.id) },
                        ]
                      : [
                          { label: '신고하기', danger: true, onClick: () => onReport(reply.id) },
                        ]
                  }
                />
              </div>
            )}
          </div>
        )
      })}

      {/* 답글 입력창: 답글 목록 맨 아래에 인라인으로 표시 */}
      {replyingToId === comment.id && (
        <div className={styles.commentRow}>
          <div className={styles.avatarCol}>
            <div className={styles.replyAvatar}>
              {meProfileImageUrl ? (
                <img src={meProfileImageUrl} alt="" className={styles.avatarImg} />
              ) : (
                getInitial(meDisplayName)
              )}
            </div>
          </div>
          <div className={styles.inputArea}>
            <input
              type="text"
              className={styles.commentInput}
              placeholder={`${comment.authorNickname?.trim() || comment.authorUsername || ''}님에게 답글 남기기...`}
              value={replyBody}
              autoFocus
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
            <div className={styles.iconBtnWrap}>
              {/* 전송 버튼: 텍스트 있을 때 fade-in + scale-up */}
              <button
                type="button"
                className={`${styles.iconBtn}${!replyBody.trim() ? ` ${styles.iconBtnHidden}` : ''}`}
                disabled={replySubmitting || !replyBody.trim()}
                onClick={() => void onReplySubmit(comment.id)}
                aria-label="답글 전송"
                tabIndex={replyBody.trim() ? 0 : -1}
              >
                <img src={arrowCircleUpIcon} alt="" className={styles.iconBtnImgSend} />
              </button>
              {/* 이미지 아이콘 버튼: 텍스트 없을 때 fade-in + scale-up */}
              <button
                type="button"
                className={`${styles.iconBtn}${replyBody.trim() ? ` ${styles.iconBtnHidden}` : ''}`}
                aria-label="사진 첨부"
                tabIndex={replyBody.trim() ? -1 : 0}
                disabled
              >
                <img src={pictureIcon} alt="" className={styles.iconBtnImgPicture} />
              </button>
            </div>
          </div>
        </div>
      )}
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
