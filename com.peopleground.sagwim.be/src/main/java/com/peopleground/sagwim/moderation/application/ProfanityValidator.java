package com.peopleground.sagwim.moderation.application;

import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.moderation.domain.ModerationErrorCode;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 부적절 단어(금지어) 포함 여부를 검증하는 컴포넌트.
 *
 * <h3>정규화 흐름</h3>
 * <ol>
 *   <li>NFKC 정규화 — 호환 자모(ㄱ, ㄴ 등 독립 자모) 및 전각·반각 문자를 표준 형태로 변환</li>
 *   <li>소문자화 — {@code Locale.ROOT} 기준 (언어 독립적)</li>
 *   <li>공백·탭·개행 제거 — {@code \s+} 패턴 제거</li>
 *   <li>NFD 정규화 — 한글 음절을 초성·중성·종성으로 분해하여 자모 단위 우회 입력을 방지</li>
 * </ol>
 *
 * <h3>매칭 전략</h3>
 * <p>정규화된 입력 문자열에 금지 단어(정규화된 형태로 저장)가 포함({@code contains})되면 즉시 예외를 던진다.
 * 금지 단어 목록은 {@code ForbiddenWordCacheService} 를 통해 Redis 에서 캐싱하여 DB 부하를 최소화한다.</p>
 *
 * <h3>주의</h3>
 * <p>{@code ForbiddenWordCacheService#loadWords()} 에 {@code @Cacheable} 이 선언되어 있다.
 * 같은 클래스 내 자기 호출(self-invocation) 시 Spring 프록시가 우회되어 캐시가 무효화되므로,
 * 캐시 어노테이션을 별도 서비스 빈({@code ForbiddenWordCacheService})으로 분리하였다.</p>
 */
@Component
@RequiredArgsConstructor
public class ProfanityValidator {

    private final ForbiddenWordCacheService forbiddenWordCacheService;

    /**
     * 입력 텍스트에 금지 단어가 포함되어 있으면 {@link AppException}(BAD_WORD_INCLUDED)을 던진다.
     *
     * @param text 검사할 텍스트. null 또는 공백이면 통과.
     * @throws AppException 금지 단어 포함 시
     */
    public void validate(String text) {
        if (text == null || text.isBlank()) {
            return;
        }
        String normalized = normalize(text);
        List<String> words = forbiddenWordCacheService.loadWords();
        if (words.isEmpty()) {
            return;
        }
        for (String word : words) {
            if (normalized.contains(word)) {
                throw new AppException(ModerationErrorCode.BAD_WORD_INCLUDED);
            }
        }
    }

    /**
     * 입력 문자열을 정규화한다.
     *
     * <p>금지 단어 저장 시에도 이 메서드로 정규화하여 DB 에 저장해야 한다.
     * 정규화 흐름: NFKC → lowercase(ROOT) → 공백 제거 → NFD</p>
     *
     * @param input 정규화할 문자열
     * @return 정규화된 문자열
     */
    public String normalize(String input) {
        String nfkc = Normalizer.normalize(input, Normalizer.Form.NFKC);
        String lower = nfkc.toLowerCase(Locale.ROOT);
        String squeezed = lower.replaceAll("\\s+", "");
        return Normalizer.normalize(squeezed, Normalizer.Form.NFD);
    }
}
