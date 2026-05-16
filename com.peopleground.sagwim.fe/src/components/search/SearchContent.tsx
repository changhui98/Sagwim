import { useCallback, useEffect, useRef, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { searchUsers } from '../../api/userApi'
import { getPosts } from '../../api/postApi'
import { getGroups } from '../../api/groupApi'
import type { UserResponse } from '../../types/user'
import type { ContentResponse } from '../../types/post'
import type { GroupResponse } from '../../types/group'
import { GROUP_CATEGORY_LABELS } from '../../types/group'
import styles from './SearchContent.module.css'

interface SearchResults {
  users: UserResponse[]
  posts: ContentResponse[]
  groups: GroupResponse[]
}

interface AvatarImageProps {
  src: string
  alt: string
  fallback: string
}

const AvatarImage: FC<AvatarImageProps> = ({ src, alt, fallback }) => {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [src])

  if (imgError) {
    return <span className={styles.avatarFallback}>{fallback}</span>
  }

  return (
    <img
      src={src}
      alt={alt}
      className={styles.avatarImg}
      onError={() => setImgError(true)}
    />
  )
}

interface SearchContentProps {
  /** 검색 결과 항목 클릭 후 호출. SidePanel에서는 패널을 닫고, 페이지에서는 no-op 전달. */
  onClose: () => void
}

export function SearchContent({ onClose }: SearchContentProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { token } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [usersRes, postsRes, groupsRes] = await Promise.allSettled([
          searchUsers(token, trimmed, 0, 5),
          getPosts(token, 0, 5, trimmed, 'TITLE'),
          getGroups(token, 0, 5, trimmed),
        ])
        setResults({
          users: usersRes.status === 'fulfilled' ? usersRes.value.content : [],
          posts: postsRes.status === 'fulfilled' ? postsRes.value.content : [],
          groups: groupsRes.status === 'fulfilled' ? groupsRes.value.content : [],
        })
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, token])

  const handleUserClick = useCallback((username: string) => {
    navigate(`/app/profile/${username}`)
    onClose()
  }, [navigate, onClose])

  const handlePostClick = useCallback((postId: number) => {
    navigate(`/app/posts/${postId}`)
    onClose()
  }, [navigate, onClose])

  const handleGroupClick = useCallback((groupId: number) => {
    navigate(`/app/groups/${groupId}`)
    onClose()
  }, [navigate, onClose])

  const hasResults =
    results &&
    (results.users.length > 0 || results.posts.length > 0 || results.groups.length > 0)

  return (
    <div className={styles.body}>
      <div className={styles.searchInputWrap}>
        <input
          ref={inputRef}
          type="search"
          className={styles.searchInput}
          placeholder="검색"
          aria-label="검색어 입력"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} aria-label="검색 중" />
        </div>
      )}

      {!loading && !query.trim() && (
        <p className={styles.emptyMessage}>검색어를 입력해주세요.</p>
      )}

      {!loading && query.trim() && results && !hasResults && (
        <p className={styles.emptyMessage}>검색 결과가 없습니다.</p>
      )}

      {!loading && results && results.users.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTitle}>유저</p>
            <button
              type="button"
              className={styles.sectionViewAll}
              onClick={() => { navigate('/app/users'); onClose() }}
            >
              전체 보기
            </button>
          </div>
          <ul className={styles.resultList}>
            {results.users.map((user) => (
              <li key={user.username}>
                <button
                  type="button"
                  className={styles.resultItem}
                  onClick={() => handleUserClick(user.username)}
                >
                  <div className={styles.avatar}>
                    {user.profileImageUrl ? (
                      <AvatarImage
                        src={user.profileImageUrl}
                        alt={user.nickname}
                        fallback={user.nickname[0]}
                      />
                    ) : (
                      <span className={styles.avatarFallback}>{user.nickname[0]}</span>
                    )}
                  </div>
                  <div className={styles.resultMeta}>
                    <span className={styles.resultPrimary}>{user.nickname}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && results && results.posts.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTitle}>게시글</p>
            <button
              type="button"
              className={styles.sectionViewAll}
              onClick={() => { navigate('/app'); onClose() }}
            >
              전체 보기
            </button>
          </div>
          <ul className={styles.resultList}>
            {results.posts.slice(0, 5).map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  className={styles.resultItem}
                  onClick={() => handlePostClick(post.id)}
                >
                  <div className={styles.resultMeta}>
                    <span className={styles.resultPrimary}>
                      {post.body.length > 60 ? post.body.slice(0, 60) + '…' : post.body}
                    </span>
                    <span className={styles.resultSecondary}>
                      {post.nickname ?? post.createdBy}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && results && results.groups.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>모임</p>
          <ul className={styles.resultList}>
            {results.groups.map((group) => (
              <li key={group.id}>
                <button
                  type="button"
                  className={styles.resultItem}
                  onClick={() => handleGroupClick(group.id)}
                >
                  <div className={styles.avatar}>
                    {group.imageUrl ? (
                      <img
                        src={group.imageUrl}
                        alt={group.name}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span className={styles.avatarFallback}>{group.name[0]}</span>
                    )}
                  </div>
                  <div className={styles.resultMeta}>
                    <span className={styles.resultPrimary}>{group.name}</span>
                    <span className={styles.resultSecondary}>
                      {GROUP_CATEGORY_LABELS[group.category]} · {group.currentMemberCount}명
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
