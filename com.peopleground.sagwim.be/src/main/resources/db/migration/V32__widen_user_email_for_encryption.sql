-- userEmail 을 결정론적 AES-256-GCM 으로 암호화 저장하면서
-- (IV || ciphertext || tag) 를 Base64 로 인코딩하므로 평문 대비 길이가 늘어난다.
-- 기존 VARCHAR(255) 로는 부족할 수 있어 컬럼을 확장한다.
-- uk_user_email 유니크 제약은 타입 변경만 하므로 그대로 유지된다(결정론적이라 암호문도 1:1).
ALTER TABLE p_user ALTER COLUMN user_email TYPE VARCHAR(512);
