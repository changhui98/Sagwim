package com.peopleground.sagwim.global.security.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * {@code userEmail} 컬럼을 DB 저장 시 결정론적 AES 로 암호화하고 읽을 때 복호화하는 JPA 컨버터.
 *
 * <p>{@code @Component} 로 등록되어 Hibernate 가 스프링 빈으로 주입한다(키 주입 필요).
 * 정확 일치 derived query / QueryDSL {@code eq} 의 바인딩 파라미터에도 컨버터가 적용되어
 * 암호문 상태로 비교되므로 검색이 투명하게 동작한다.</p>
 */
@Component
@Converter
@RequiredArgsConstructor
public class EmailEncryptConverter implements AttributeConverter<String, String> {

    private final DeterministicAesCipher cipher;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        return cipher.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return cipher.decrypt(dbData);
        } catch (EmailDecryptException e) {
            // 백필 과도기: 아직 평문인 레코드는 그대로 반환한다.
            return dbData;
        }
    }
}
