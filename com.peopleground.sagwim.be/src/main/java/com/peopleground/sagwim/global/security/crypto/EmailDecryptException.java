package com.peopleground.sagwim.global.security.crypto;

/**
 * 복호화 실패를 나타낸다.
 *
 * <p>이미 암호화된 값이 아니거나(평문 백필 과도기) GCM 인증 태그 검증에 실패한 경우 던져진다.
 * 호출 측은 이 예외로 "평문 레코드"를 구분해 그대로 다룰 수 있다.</p>
 */
public class EmailDecryptException extends RuntimeException {

    public EmailDecryptException(Throwable cause) {
        super(cause);
    }
}
