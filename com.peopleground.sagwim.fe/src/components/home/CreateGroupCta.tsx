import { useNavigate } from 'react-router-dom'
import styles from './CreateGroupCta.module.css'

/** 리스트 하단 "직접 만들어보세요" CTA 배너 */
export function CreateGroupCta() {
  const navigate = useNavigate()
  return (
    <section className={styles.cta}>
      <div className={styles.textCol}>
        <h3 className={styles.title}>원하는 모임이 없나요?</h3>
        <p className={styles.subtitle}>직접 만들어서 이웃을 초대해보세요</p>
      </div>
      <button
        type="button"
        className={styles.button}
        onClick={() => navigate('/app/create')}
      >
        모임 만들기
      </button>
    </section>
  )
}
