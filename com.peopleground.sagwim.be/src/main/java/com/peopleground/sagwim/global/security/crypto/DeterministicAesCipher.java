package com.peopleground.sagwim.global.security.crypto;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 결정론적 AES-256-GCM 암호기.
 *
 * <p>같은 평문은 항상 같은 암호문이 되도록 IV 를 평문에서 유도한다
 * ({@code IV = HMAC-SHA256(key, plaintext)} 의 앞 12바이트). 이로써</p>
 * <ul>
 *     <li>유니크 제약을 암호문 상태로도 유지할 수 있고,</li>
 *     <li>정확 일치 검색({@code findByUserEmail}, {@code existsByUserEmail}, QueryDSL {@code eq})이 동작한다.</li>
 * </ul>
 *
 * <p>GCM 인증 태그를 포함하므로 무결성 검증이 가능하고, 복호화 실패로 평문/암호문을 구분할 수 있다
 * (백필 과도기 호환). JDK {@code javax.crypto} 만 사용하며 외부 라이브러리가 필요 없다.</p>
 *
 * <p>주의: 결정론적 암호화는 "같은 평문 → 같은 암호문"이라는 본질적 특성상 동일 값 노출이 가능하다.
 * email 은 유니크 컬럼이라 빈도 분석 위험이 사실상 없어 허용된다.</p>
 */
@Component
public class DeterministicAesCipher {

    private static final String AES_GCM = "AES/GCM/NoPadding";
    private static final String HMAC_ALGO = "HmacSHA256";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final byte[] IV_DOMAIN = "email-iv".getBytes(StandardCharsets.UTF_8);

    private final SecretKey aesKey;
    private final SecretKeySpec hmacKey;

    public DeterministicAesCipher(@Value("${app.crypto.email-key}") String base64Key) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        if (keyBytes.length != 32) {
            throw new IllegalStateException(
                "app.crypto.email-key 는 Base64 인코딩된 32바이트(AES-256) 키여야 합니다. 현재 길이="
                    + keyBytes.length);
        }
        this.aesKey = new SecretKeySpec(keyBytes, "AES");
        this.hmacKey = new SecretKeySpec(keyBytes, HMAC_ALGO);
    }

    /**
     * 평문을 암호화해 {@code Base64(IV || ciphertext||tag)} 문자열로 반환한다.
     */
    public String encrypt(String plaintext) {
        try {
            byte[] plainBytes = plaintext.getBytes(StandardCharsets.UTF_8);
            byte[] iv = deterministicIv(plainBytes);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] cipherText = cipher.doFinal(plainBytes);

            byte[] combined = new byte[IV_LENGTH + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, IV_LENGTH);
            System.arraycopy(cipherText, 0, combined, IV_LENGTH, cipherText.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("이메일 암호화 실패", e);
        }
    }

    /**
     * {@link #encrypt} 로 만든 문자열을 평문으로 복호화한다.
     *
     * @throws EmailDecryptException 형식이 아니거나(평문) 무결성 검증 실패 시
     */
    public String decrypt(String encoded) {
        try {
            byte[] combined = Base64.getDecoder().decode(encoded);
            if (combined.length <= IV_LENGTH) {
                throw new EmailDecryptException(
                    new IllegalArgumentException("암호문 길이가 너무 짧습니다."));
            }
            byte[] iv = Arrays.copyOfRange(combined, 0, IV_LENGTH);
            byte[] cipherText = Arrays.copyOfRange(combined, IV_LENGTH, combined.length);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(cipherText), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new EmailDecryptException(e);
        }
    }

    private byte[] deterministicIv(byte[] plainBytes) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(hmacKey);
            mac.update(IV_DOMAIN);
            byte[] full = mac.doFinal(plainBytes);
            return Arrays.copyOfRange(full, 0, IV_LENGTH);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("IV 유도 실패", e);
        }
    }
}
