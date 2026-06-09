package com.peopleground.sagwim.global.security.crypto;

import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 기존 평문 user_email 을 결정론적 AES 암호문으로 1회 백필한다.
 *
 * <p>{@link JdbcTemplate} native 쿼리로 raw 컬럼을 직접 읽고/쓴다.
 * 엔티티 경유 시 {@link EmailEncryptConverter} 가 또 암호화해 이중 암호화가 되므로 반드시 native 로 처리한다.</p>
 *
 * <p>멱등: 각 값을 복호화 시도해 성공(이미 암호문)이면 건너뛰고, 실패(평문)면 암호화한다.
 * 결정론적 암호화라 같은 평문은 항상 같은 암호문이 되어 재실행해도 안전하다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailEncryptionBackfillRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final DeterministicAesCipher cipher;

    @Override
    public void run(ApplicationArguments args) {
        List<Map<String, Object>> rows =
            jdbcTemplate.queryForList("SELECT id, user_email FROM p_user");

        int encrypted = 0;
        for (Map<String, Object> row : rows) {
            String raw = (String) row.get("user_email");
            if (raw == null || isEncrypted(raw)) {
                continue;
            }
            jdbcTemplate.update(
                "UPDATE p_user SET user_email = ? WHERE id = ?",
                cipher.encrypt(raw), row.get("id"));
            encrypted++;
        }

        if (encrypted > 0) {
            log.info("[EmailBackfill] 평문 이메일 {}건을 암호화했습니다.", encrypted);
        }
    }

    private boolean isEncrypted(String value) {
        try {
            cipher.decrypt(value);
            return true;
        } catch (EmailDecryptException e) {
            return false;
        }
    }
}
