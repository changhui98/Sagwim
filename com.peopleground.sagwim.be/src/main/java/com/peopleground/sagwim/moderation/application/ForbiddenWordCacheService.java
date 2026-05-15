package com.peopleground.sagwim.moderation.application;

import com.peopleground.sagwim.moderation.domain.repository.ForbiddenWordRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * 금지 단어 목록 Redis 캐시 서비스.
 *
 * <p>{@code @Cacheable} 은 Spring AOP 프록시를 통해서만 동작한다.
 * 같은 클래스 내부(self-invocation)에서 호출하면 프록시를 우회하여 캐시가 적용되지 않는다.
 * 이 문제를 방지하기 위해 캐시 어노테이션을 별도 컴포넌트({@code ForbiddenWordCacheService})로 분리하고,
 * {@code ProfanityValidator} 가 이 빈을 주입받아 사용한다.</p>
 *
 * <p>캐시 이름 {@code "moderation:forbidden-words"} 의 TTL은 {@code RedisConfig} 에서 30분으로 설정된다.
 * 단어 추가/삭제 시 캐시 무효화({@code @CacheEvict})는 다음 단계(관리자 CRUD)에서 추가한다.</p>
 */
@Service
@RequiredArgsConstructor
public class ForbiddenWordCacheService {

    static final String CACHE_NAME = "moderation:forbidden-words";

    private final ForbiddenWordRepository forbiddenWordRepository;

    /**
     * 활성 금지 단어 목록을 반환한다. Redis 에 캐시가 있으면 캐시에서, 없으면 DB 에서 조회 후 캐시에 저장한다.
     * TTL: 30분 (RedisConfig 설정).
     */
    @Cacheable(CACHE_NAME)
    public List<String> loadWords() {
        return forbiddenWordRepository.findAllActiveWords();
    }
}
