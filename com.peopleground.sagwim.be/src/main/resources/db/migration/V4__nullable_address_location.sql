-- =====================================================
-- V4: p_user 테이블의 address, location 컬럼을 nullable로 변경
-- 회원가입 시 주소 입력을 선택 사항으로 변경 (프로필 수정에서 입력)
-- =====================================================

ALTER TABLE p_user
    ALTER COLUMN address DROP NOT NULL;

ALTER TABLE p_user
    ALTER COLUMN location DROP NOT NULL;
