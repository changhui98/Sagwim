package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.global.log.RegistrationLogger;
import com.peopleground.sagwim.global.redis.TokenBlacklistService;
import com.peopleground.sagwim.global.security.jwt.JwtTokenProvider;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import com.peopleground.sagwim.user.presentation.dto.request.UserCreateRequest;
import com.peopleground.sagwim.user.presentation.dto.response.UserCreateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final RegistrationLogger registrationLogger;
    private final RandomNicknameGenerator randomNicknameGenerator;

    @Transactional
    public UserCreateResponse signUp(UserCreateRequest request) {

        validateDuplicateUsername(request.username());
        validateDuplicateEmail(request.userEmail());

        emailVerificationService.checkPreVerified(request.userEmail());

        // 닉네임 미입력 시 랜덤 한글 닉네임 자동 생성
        String nickname = (request.nickname() != null && !request.nickname().isBlank())
            ? request.nickname()
            : randomNicknameGenerator.generate();

        validateDuplicateNickname(nickname);

        User user = User.of(
            request.username(),
            passwordEncoder.encode(request.password()),
            nickname,
            request.userEmail()
        );

        user.verifyEmail();
        User saveUser = userRepository.save(user);

        emailVerificationService.deletePreVerification(saveUser.getUserEmail());
        final String savedUsername = saveUser.getUsername();
        final String savedEmail = saveUser.getUserEmail();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                registrationLogger.log(savedUsername, savedEmail, "LOCAL");
            }
        });

        return UserCreateResponse.from(saveUser);
    }

    private void validateDuplicateEmail(String userEmail) {

        if (userRepository.existsByUserEmail(userEmail)) {
            throw new AppException(UserErrorCode.DUPLICATE_EMAIL);
        }
    }

    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username);
    }

    public boolean isNicknameAvailable(String nickname) {
        return !userRepository.existsByNickname(nickname);
    }

    /**
     * 로그아웃: Access Token을 Redis 블랙리스트에 등록한다.
     *
     * @param token Authorization 헤더에서 추출한 Access Token (Bearer prefix 제외)
     */
    public void signOut(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        long remaining = jwtTokenProvider.getRemainingExpiration(token);
        tokenBlacklistService.addToBlacklist(token, remaining);
    }

    private void validateDuplicateUsername(String username) {

        if (userRepository.existsByUsername(username)) {
            throw new AppException(UserErrorCode.DUPLICATE_USERNAME);
        }
    }

    private void validateDuplicateNickname(String nickname) {

        if (userRepository.existsByNickname(nickname)) {
            throw new AppException(UserErrorCode.DUPLICATE_NICKNAME);
        }
    }
}
