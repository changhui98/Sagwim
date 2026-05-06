-- V7: p_group 테이블에 status 컬럼 추가 (승인 워크플로우)
ALTER TABLE p_group
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- 기존 데이터는 ACTIVE로 유지 (운영 중인 모임)
-- 이후 신규 생성 모임은 GroupService에서 PENDING으로 설정
