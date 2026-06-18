import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

/**
 * 두레식 4컬럼 푸터. 메인·목록형 페이지 하단에만 삽입한다.
 * 실제 라우트가 있는 항목만 Link로 연결하고, 미구현 항목은 "준비 중" 안내.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.columns}>
          <div className={styles.col}>
            <h3 className={styles.colTitle}>모임</h3>
            <Link to="/app/groups/all" className={styles.link}>전체 모임</Link>
            <Link to="/app/groups/popular" className={styles.link}>인기 모임</Link>
            <Link to="/app/groups/recent" className={styles.link}>새로운 모임</Link>
          </div>

          <div className={styles.col}>
            <h3 className={styles.colTitle}>Sagwim</h3>
            <Link to="/about" className={styles.link}>회사 소개</Link>
            <Link to="/notice" className={styles.link}>공지사항</Link>
          </div>

          <div className={styles.col}>
            <h3 className={styles.colTitle}>고객지원</h3>
            <Link to="/support" className={styles.link}>고객센터</Link>
            <Link to="/faq" className={styles.link}>자주 묻는 질문</Link>
            <Link to="/inquiry" className={styles.link}>1:1 문의</Link>
          </div>

          <div className={styles.col}>
            <h3 className={styles.colTitle}>약관·정책</h3>
            <Link to="/terms" className={styles.link}>이용약관</Link>
            <Link to="/privacy" className={`${styles.link} ${styles.linkStrong}`}>개인정보처리방침</Link>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.company}>
          <div className={styles.brandRow}>Sagwim</div>
          <p>이웃과 함께하는 동네 모임 플랫폼</p>
          <p className={styles.copyright}>© 2026 Sagwim. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
