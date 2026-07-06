import { useCallback, useEffect, useRef, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { searchUsers } from '../../api/userApi'
import { getPosts } from '../../api/postApi'
import { getGroups } from '../../api/groupApi'
import { getSearchHistory, saveSearchHistory } from '../../api/searchHistoryApi'
import type { UserResponse } from '../../types/user'
import type { ContentResponse } from '../../types/post'
import type { GroupResponse } from '../../types/group'
import { GROUP_CATEGORY_LABELS } from '../../types/group'
import type { SearchHistoryResponse } from '../../types/searchHistory'
import { getPastelTone } from '../../utils/stringUtils'
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
  const [recent, setRecent] = useState<SearchHistoryResponse[]>([])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 최근 검색 기록 로드
  useEffect(() => {
    let active = true
    getSearchHistory(token)
      .then((data) => { if (active) setRecent(data) })
      .catch(() => { if (active) setRecent([]) })
    return () => { active = false }
  }, [token])

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
    void saveSearchHistory(token, 'USER', username).catch(() => {})
    navigate(`/app/profile/${username}`)
    onClose()
  }, [navigate, onClose, token])

  const handlePostClick = useCallback((postId: number) => {
    void saveSearchHistory(token, 'POST', String(postId)).catch(() => {})
    navigate(`/app/posts/${postId}`)
    onClose()
  }, [navigate, onClose, token])

  const handleGroupClick = useCallback((groupId: number) => {
    void saveSearchHistory(token, 'GROUP', String(groupId)).catch(() => {})
    navigate(`/app/groups/${groupId}`)
    onClose()
  }, [navigate, onClose, token])

  // 최근 검색 항목 클릭 — type 별 상세로 이동 (재방문도 기록 갱신)
  const handleRecentClick = useCallback((item: SearchHistoryResponse) => {
    if (item.type === 'USER') handleUserClick(item.targetId)
    else if (item.type === 'POST') handlePostClick(Number(item.targetId))
    else handleGroupClick(Number(item.targetId))
  }, [handleUserClick, handlePostClick, handleGroupClick])

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

      {!loading && !query.trim() && recent.length === 0 && (
        <p className={styles.emptyMessage}>검색어를 입력해주세요.</p>
      )}

      {!loading && !query.trim() && recent.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTitle}>최근 검색</p>
          </div>
          <ul className={styles.resultList}>
            {recent.map((item) => (
              <li key={`${item.type}-${item.targetId}`}>
                <button
                  type="button"
                  className={styles.resultItem}
                  onClick={() => handleRecentClick(item)}
                >
                  {item.type === 'USER' && (
                    <div className={`${styles.avatar} tone-${getPastelTone(item.label)}`}>
                      {item.profileImageUrl ? (
                        <AvatarImage
                          src={item.profileImageUrl}
                          alt={item.label}
                          fallback={item.label[0]}
                        />
                      ) : (
                        <span className={styles.avatarFallback}>{item.label[0]}</span>
                      )}
                    </div>
                  )}
                  <div className={styles.resultMeta}>
                    <span className={styles.resultPrimary}>
                      {item.label.length > 60 ? item.label.slice(0, 60) + '…' : item.label}
                    </span>
                    <span className={styles.resultSecondary}>
                      {item.type === 'USER' ? '유저' : item.type === 'POST' ? '게시글' : '모임'}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
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
                  <div className={`${styles.avatar} tone-${getPastelTone(user.nickname)}`}>
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
                  <div className={`${styles.avatar} tone-${getPastelTone(group.name)}`}>
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
