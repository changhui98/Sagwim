package com.peopleground.sagwim.moderation.application;

import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.moderation.domain.ModerationErrorCode;
import com.peopleground.sagwim.moderation.domain.entity.ForbiddenWord;
import com.peopleground.sagwim.moderation.domain.entity.ForbiddenWordStatus;
import com.peopleground.sagwim.moderation.domain.repository.ForbiddenWordRepository;
import com.peopleground.sagwim.moderation.presentation.dto.response.ForbiddenWordResponse;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자용 금지 단어 CRUD 서비스.
 *
 * <p>단어 저장 전 반드시 {@code ProfanityValidator#normalize()} 로 정규화하여
 * DB 에 일관된 형태가 저장되도록 한다.</p>
 *
 * <p>변경(등록/수정/삭제) 시 Redis 캐시({@code "moderation:forbidden-words"})를 무효화하여
 * {@code ProfanityValidator} 가 최신 목록을 사용하도록 한다.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ForbiddenWordAdminService {

    private final ForbiddenWordRepository forbiddenWordRepository;
    private final ProfanityValidator profanityValidator;
    private final CacheManager cacheManager;
    private final UserRepository userRepository;

    /**
     * 금지 단어 목록을 페이징하여 반환한다. 활성/삭제 무관 전체 목록을 최신 등록순으로 반환한다.
     * 등록자 닉네임을 포함한다.
     *
     * @param page 0-based 페이지 번호
     * @param size 페이지 크기
     * @return 금지 단어 페이지 응답
     */
    @Transactional(readOnly = true)
    public PageResponse<ForbiddenWordResponse> getForbiddenWords(int page, int size, String keyword) {
        PageRequest pageRequest = PageRequest.of(page, size);

        // 검색 키워드는 저장 시와 동일하게 정규화하여 부분 일치 비교한다.
        String normalizedKeyword = keyword == null ? "" : profanityValidator.normalize(keyword);
        Page<ForbiddenWord> resultPage = normalizedKeyword.isBlank()
            ? forbiddenWordRepository.findPage(pageRequest)
            : forbiddenWordRepository.searchPage(normalizedKeyword, pageRequest);

        return PageResponse.from(resultPage.map(entity -> {
            String nickname = resolveNickname(entity.getCreatedByUsername());
            return ForbiddenWordResponse.of(entity, nickname);
        }));
    }

    /**
     * 금지 단어를 등록한다.
     *
     * <ol>
     *   <li>입력 단어를 정규화한다.</li>
     *   <li>정규화 결과가 빈 문자열이면 M004 예외를 던진다.</li>
     *   <li>이미 활성 상태로 동일 단어가 존재하면 M003 예외를 던진다.</li>
     *   <li>저장 후 캐시를 무효화한다.</li>
     *   <li>save 시 DataIntegrityViolationException 발생 시 M003 으로 변환한다 (race condition 안전망).</li>
     * </ol>
     *
     * @param rawWord      원본 입력 단어
     * @param adminUsername 등록 관리자 username
     * @return 저장된 금지 단어 응답
     */
    public ForbiddenWordResponse createForbiddenWord(String rawWord, String adminUsername) {
        String normalized = normalize(rawWord);
        validateNotBlank(normalized);
        validateNotDuplicate(normalized);

        ForbiddenWord saved;
        try {
            saved = forbiddenWordRepository.save(ForbiddenWord.of(normalized, adminUsername));
        } catch (DataIntegrityViolationException e) {
            // partial unique index 충돌: race condition 으로 같은 단어가 동시에 삽입된 경우
            throw new AppException(ModerationErrorCode.FORBIDDEN_WORD_ALREADY_EXISTS);
        }
        evictCache();

        String nickname = resolveNickname(adminUsername);
        return ForbiddenWordResponse.of(saved, nickname);
    }

    /**
     * 기존 금지 단어를 수정한다.
     *
     * <ol>
     *   <li>활성 단어가 없으면 M002 예외를 던진다.</li>
     *   <li>정규화 결과가 빈 문자열이면 M004 예외를 던진다.</li>
     *   <li>자기 자신 제외한 중복이 있으면 M003 예외를 던진다.</li>
     *   <li>수정 후 캐시를 무효화한다.</li>
     *   <li>flush 시 DataIntegrityViolationException 발생 시 M003 으로 변환한다 (race condition 안전망).</li>
     * </ol>
     *
     * @param id     수정할 금지 단어 ID
     * @param rawWord 원본 입력 단어
     * @return 수정된 금지 단어 응답
     */
    public ForbiddenWordResponse updateForbiddenWord(Long id, String rawWord) {
        ForbiddenWord entity = findActiveOrThrow(id);

        String normalized = normalize(rawWord);
        validateNotBlank(normalized);

        // 자기 자신과 동일한 단어는 중복 검사에서 제외
        if (!entity.getWord().equals(normalized)) {
            validateNotDuplicate(normalized);
        }

        try {
            entity.updateWord(normalized);
            evictCache();
        } catch (DataIntegrityViolationException e) {
            // partial unique index 충돌: race condition 으로 같은 단어가 동시에 변경된 경우
            throw new AppException(ModerationErrorCode.FORBIDDEN_WORD_ALREADY_EXISTS);
        }

        String nickname = resolveNickname(entity.getCreatedByUsername());
        return ForbiddenWordResponse.of(entity, nickname);
    }

    /**
     * 금지 단어의 차단 활성 상태를 변경한다. (ACTIVE ↔ INACTIVE)
     *
     * <p>활성/비활성은 삭제와 무관하다. ACTIVE 단어만 게시글/모임 생성 차단 검증에 사용된다.</p>
     *
     * @param id     대상 금지 단어 ID
     * @param status 변경할 상태
     * @return 변경된 금지 단어 응답
     */
    public ForbiddenWordResponse changeStatus(Long id, ForbiddenWordStatus status) {
        ForbiddenWord entity = findActiveOrThrow(id);

        if (status == ForbiddenWordStatus.ACTIVE) {
            entity.activate();
        } else {
            entity.deactivate();
        }
        evictCache();

        String nickname = resolveNickname(entity.getCreatedByUsername());
        return ForbiddenWordResponse.of(entity, nickname);
    }

    /**
     * 금지 단어를 영구 삭제(하드 딜리트)한다.
     *
     * @param id 삭제할 금지 단어 ID
     */
    public void deleteForbiddenWord(Long id) {
        ForbiddenWord entity = findActiveOrThrow(id);
        forbiddenWordRepository.delete(entity);
        evictCache();
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private ForbiddenWord findActiveOrThrow(Long id) {
        return forbiddenWordRepository.findActiveById(id)
            .orElseThrow(() -> new AppException(ModerationErrorCode.FORBIDDEN_WORD_NOT_FOUND));
    }

    private String normalize(String rawWord) {
        return profanityValidator.normalize(rawWord);
    }

    private void validateNotBlank(String normalized) {
        if (normalized.isBlank()) {
            throw new AppException(ModerationErrorCode.FORBIDDEN_WORD_BLANK);
        }
    }

    private void validateNotDuplicate(String normalized) {
        if (forbiddenWordRepository.existsActiveByWord(normalized)) {
            throw new AppException(ModerationErrorCode.FORBIDDEN_WORD_ALREADY_EXISTS);
        }
    }

    /**
     * {@code "moderation:forbidden-words"} 캐시를 무효화한다.
     * 트랜잭션 내에서 호출되므로 변경사항이 커밋될 때 캐시도 함께 비워진다.
     */
    private void evictCache() {
        var cache = cacheManager.getCache(ForbiddenWordCacheService.CACHE_NAME);
        if (cache != null) {
            cache.clear();
        }
    }

    /**
     * username 으로 사용자 닉네임을 조회한다. 사용자가 없거나 username 이 null 이면 null 을 반환한다.
     *
     * @param username 조회할 username
     * @return 닉네임 또는 null
     */
    private String resolveNickname(String username) {
        if (username == null) {
            return null;
        }
        return userRepository.findByUsername(username)
            .map(user -> user.getNickname())
            .orElse(null);
    }
}
