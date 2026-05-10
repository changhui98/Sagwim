import { type KeyboardEvent, useRef, useState } from 'react'
import styles from './MessageInput.module.css'

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // 한글 IME 조합 중 Enter는 무시한다.
      // isComposing이 true이거나 keyCode 229(IME 합성 키)인 경우 조합이 아직 진행 중임.
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  return (
    <div className={styles.container}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        placeholder="메시지를 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        rows={1}
        disabled={disabled}
      />
      <button
        className={styles.sendButton}
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="메시지 전송"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  )
}
