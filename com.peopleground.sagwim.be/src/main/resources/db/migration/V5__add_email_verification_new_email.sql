-- =====================================================
-- email_verification_token: 이메일 변경 플로우용 컬럼 추가
-- 기존 가입 후 이메일 인증 플로우는 NULL을 그대로 사용한다.
-- 이메일 변경 인증 시 사용자가 변경하려는 새 이메일을 보관한다.
-- =====================================================
ALTER TABLE email_verification_token
    ADD COLUMN IF NOT EXISTS new_email VARCHAR(255);
