package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 한글 형용사 + 명사 조합으로 랜덤 닉네임을 생성한다.
 * DB 중복 확인 후 사용 가능한 닉네임을 반환하며, 최대 10회까지 재시도한다.
 */
@Component
@RequiredArgsConstructor
public class RandomNicknameGenerator {

    private static final int MAX_ATTEMPTS = 10;

    private static final List<String> ADJECTIVES = List.of(
        "빠른", "느긋한", "용감한", "귀여운", "멋진",
        "따뜻한", "신나는", "활발한", "조용한", "슬기로운",
        "영리한", "씩씩한", "다정한", "밝은", "엉뚱한",
        "행복한", "부지런한", "사랑스런", "재빠른", "포근한",
        "날쌘", "든든한", "반짝이는", "솔직한", "유쾌한",
        "강인한", "상냥한", "명랑한", "순수한", "눈부신"
    );

    private static final List<String> NOUNS = List.of(
        "토끼", "거북이", "사자", "판다", "여우",
        "다람쥐", "고양이", "강아지", "수달", "펭귄",
        "하마", "코알라", "기린", "독수리", "부엉이",
        "햄스터", "고슴도치", "라쿤", "사슴", "돌고래",
        "나비", "무지개", "별빛", "달님", "새싹",
        "솜사탕", "구름", "바람", "꽃잎", "보름달"
    );

    private final UserRepository userRepository;

    /**
     * DB 중복 없는 랜덤 닉네임을 생성하여 반환한다.
     *
     * @throws AppException 최대 시도 횟수 초과 시 DUPLICATE_NICKNAME 에러
     */
    public String generate() {
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            String adjective = ADJECTIVES.get(rng.nextInt(ADJECTIVES.size()));
            String noun = NOUNS.get(rng.nextInt(NOUNS.size()));
            String candidate = adjective + noun;

            if (!userRepository.existsByNickname(candidate)) {
                return candidate;
            }
        }

        throw new AppException(UserErrorCode.DUPLICATE_NICKNAME);
    }
}
