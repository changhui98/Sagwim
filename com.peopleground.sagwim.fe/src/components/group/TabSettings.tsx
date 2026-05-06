import { useState } from 'react'
import type { GroupDetailResponse } from '../../types/group'
import pageStyles from '../../pages/GroupDetailPage.module.css'
import styles from './TabSettings.module.css'

type SubView = 'menu' | 'info' | 'memberCount'

interface TabSettingsProps {
  group: GroupDetailResponse
  actionLoading: boolean
  onSaveInfo: (data: { name: string; description: string }) => void
  onSaveMemberCount: (maxMemberCount: number) => void
  onDelete: () => void
}

export function TabSettings({ group, actionLoading, onSaveInfo, onSaveMemberCount, onDelete }: TabSettingsProps) {
  const [view, setView] = useState<SubView>('menu')

  const [editName, setEditName] = useState(group.name)
  const [editDescription, setEditDescription] = useState(group.description ?? '')
  const [editMaxMemberCount, setEditMaxMemberCount] = useState(group.maxMemberCount)

  const handleBackToMenu = () => setView('menu')

  if (view === 'info') {
    return (
      <div className={styles.subForm}>
        <button type="button" className={styles.backBtn} onClick={handleBackToMenu}>
          ← 뒤로
        </button>
        <input
          type="text"
          className={pageStyles.editInput}
          placeholder="모임 이름 (최대 50자)"
          maxLength={50}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
        />
        <textarea
          className={pageStyles.editTextarea}
          placeholder="모임 설명 (최대 1000자)"
          maxLength={1000}
          rows={4}
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
        />
        <div className={styles.formActions}>
          <button
            type="button"
            className={pageStyles.cancelButton}
            onClick={handleBackToMenu}
            disabled={actionLoading}
          >
            취소
          </button>
          <button
            type="button"
            className={pageStyles.saveButton}
            onClick={() => onSaveInfo({ name: editName, description: editDescription })}
            disabled={actionLoading}
          >
            {actionLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    )
  }

  if (view === 'memberCount') {
    return (
      <div className={styles.subForm}>
        <button type="button" className={styles.backBtn} onClick={handleBackToMenu}>
          ← 뒤로
        </button>
        <input
          type="number"
          className={pageStyles.editInput}
          min={2}
          max={1000}
          value={editMaxMemberCount}
          onChange={(e) => setEditMaxMemberCount(Number(e.target.value))}
        />
        <div className={styles.formActions}>
          <button
            type="button"
            className={pageStyles.cancelButton}
            onClick={handleBackToMenu}
            disabled={actionLoading}
          >
            취소
          </button>
          <button
            type="button"
            className={pageStyles.saveButton}
            onClick={() => onSaveMemberCount(editMaxMemberCount)}
            disabled={actionLoading}
          >
            {actionLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <ul className={styles.menuList}>
      <li>
        <button type="button" className={styles.menuItem} onClick={() => setView('info')}>
          <span>모임이름/소개 변경</span>
          <span className={styles.chevron}>›</span>
        </button>
      </li>
      <li>
        <button type="button" className={styles.menuItem} onClick={() => setView('memberCount')}>
          <span>모임 인원 변경</span>
          <span className={styles.chevron}>›</span>
        </button>
      </li>
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => alert('모임장 변경 기능은 준비 중입니다.')}
        >
          <span>모임장 변경</span>
          <span className={styles.chevron}>›</span>
        </button>
      </li>
      <li>
        <button
          type="button"
          className={`${styles.menuItem} ${styles.menuItemDanger}`}
          onClick={onDelete}
          disabled={actionLoading}
        >
          <span>모임 삭제</span>
          <span className={styles.chevron}>›</span>
        </button>
      </li>
    </ul>
  )
}
