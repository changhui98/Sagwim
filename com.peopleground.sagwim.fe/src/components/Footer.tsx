import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

/**
 * 두레식 4컬럼 푸터. 메인·목록형 페이지 하단에만 삽입한다.
 * 실제 라우트가 있는 항목만 Link로 연결하고, 미구현 항목은 "준비 중" 안내.
 */
export function Footer() {
  const notice = (label: string) => window.alert(`${label} 기능은 준비 중입니다.`)

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.columns}>
          <div className={styles.col}>
            <h3 className={styles.colTitle}>모임</h3>
            <Link to="/app/groups/all" className={styles.link}>전체 모임</Link>
            <Link to="/app/groups/popular" className={styles.link}>인기 모임</Link>
            <Link to="/app/groups/recent" className={styles.link}>새로운 모임</Link>
            <Link to="/app/groups/deadline" className={styles.link}>마감 임박</Link>
          </div>

          <div className={styles.col}>
            <h3 className={styles.colTitle}>Sagwim</h3>
            <button type="button" className={styles.link} onClick={() => notice('회사 소개')}>회사 소개</button>
            <button type="button" className={styles.link} onClick={() => notice('공지사항')}>공지사항</button>
          </div>

          <div className={styles.col}>
            <h3 className={styles.colTitle}>고객지원</h3>
            <button type="button" className={styles.link} onClick={() => notice('고객센터')}>고객센터</button>
            <button type="button" className={styles.link} onClick={() => notice('자주 묻는 질문')}>자주 묻는 질문</button>
            <button type="button" className={styles.link} onClick={() => notice('1:1 문의')}>1:1 문의</button>
          </div>

          <div className={styles.col}>
            <h3 className={styles.colTitle}>약관·정책</h3>
            <button type="button" className={styles.link} onClick={() => notice('이용약관')}>이용약관</button>
            <button type="button" className={styles.link} onClick={() => notice('개인정보처리방침')}>개인정보처리방침</button>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.company}>
          <div className={styles.brandRow}>Sagwim</div>
          <p>이웃과 함께하는 동네 모임 플랫폼</p>
          <p>상호명 (주)사가위 · 대표 OOO · 사업자등록번호 000-00-00000</p>
          <p>주소 서울특별시 · 고객센터 0000-0000</p>
          <p className={styles.copyright}>© 2026 Sagwim. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
