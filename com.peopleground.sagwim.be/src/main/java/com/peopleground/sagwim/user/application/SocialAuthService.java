package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.global.log.RegistrationLogger;
import com.peopleground.sagwim.global.security.jwt.JwtTokenProvider;
import com.peopleground.sagwim.user.application.port.OAuthClient;
import com.peopleground.sagwim.user.application.port.OAuthUserProfile;
import com.peopleground.sagwim.user.domain.EmailConflictException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.OAuthProvider;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import com.peopleground.sagwim.user.presentation.dto.request.SocialLinkRequest;
import com.peopleground.sagwim.user.presentation.dto.request.SocialSignInRequest;
import com.peopleground.sagwim.user.presentation.dto.response.SocialSignInResponse;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocialAuthService {

    private final UserRepository userRepository;
    private final OAuthClient kakaoOAuthClient;
    private final OAuthClient googleOAuthClient;
    private final JwtTokenProvider jwtTokenProvider;
    private final RegistrationLogger registrationLogger;

    public SocialAuthService(
        UserRepository userRepository,
        @Qualifier("kakaoOAuthClient") OAuthClient kakaoOAuthClient,
        @Qualifier("googleOAuthClient") OAuthClient googleOAuthClient,
        JwtTokenProvider jwtTokenProvider,
        RegistrationLogger registrationLogger
    ) {
        this.userRepository = userRepository;
        this.kakaoOAuthClient = kakaoOAuthClient;
        this.googleOAuthClient = googleOAuthClient;
        this.jwtTokenProvider = jwtTokenProvider;
        this.registrationLogger = registrationLogger;
    }

    @Transactional
    public SocialSignInResponse socialSignIn(SocialSignInRequest request) {
        OAuthProvider provider = resolveProvider(request.provider());

        return switch (provider) {
            case KAKAO -> handleSignIn(OAuthProvider.KAKAO, kakaoOAuthClient, request.code(), request.redirectUri());
            case GOOGLE -> handleSignIn(OAuthProvider.GOOGLE, googleOAuthClient, request.code(), request.redirectUri());
            default -> throw new AppException(ApiErrorCode.INVALID_REQUEST);
        };
    }

    /**
     * 기존 계정에 소셜 provider를 연동하고 JWT를 발급한다.
     *
     * <p>프론트엔드에서 409 응답을 받은 후 사용자 동의 하에 호출된다.
     * sign-in 단계에서 이미 code를 소진했으므로, 재교환 없이 409 바디에 담긴
     * accessToken을 직접 받아 프로필 조회에만 사용한다.</p>
     */
    @Transactional
    public SocialSignInResponse linkSocialAccount(SocialLinkRequest request) {
        OAuthProvider provider = resolveProvider(request.provider());
        OAuthClient client = resolveClient(provider);

        OAuthUserProfile profile = client.fetchUserProfile(request.accessToken());

        String email = profile.email() != null ? profile.email()
            : provider.name().toLowerCase() + "_" + profile.providerId() + "@sagwim.social";

        User user = userRepository.findByUserEmail(email)
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));

        user.linkSocialProvider(provider, profile.providerId());

        String jwtToken = jwtTokenProvider.createToken(user.getId(), user.getUsername(), user.getRole());
        return new SocialSignInResponse(jwtToken, false, user.getNickname());
    }

    private SocialSignInResponse handleSignIn(OAuthProvider provider, OAuthClient client, String code, String redirectUri) {
        String accessToken = client.exchangeToken(code, redirectUri);
        OAuthUserProfile profile = client.fetchUserProfile(accessToken);

        // 1. 동일 provider + providerId로 이미 가입된 계정 확인
        Optional<User> existingBySocial = userRepository.findByProviderAndProviderId(provider, profile.providerId());
        if (existingBySocial.isPresent()) {
            User user = existingBySocial.get();
            String jwtToken = jwtTokenProvider.createToken(user.getId(), user.getUsername(), user.getRole());
            return new SocialSignInResponse(jwtToken, false, user.getNickname());
        }

        String email = profile.email() != null ? profile.email()
            : provider.name().toLowerCase() + "_" + profile.providerId() + "@sagwim.social";

        // 2. 동일 이메일로 다른 provider(LOCAL 포함)로 가입된 계정 확인 → 연동 필요
        // code는 이미 소진됐으므로, 교환한 accessToken을 예외에 담아 컨트롤러로 전달한다.
        if (userRepository.existsByUserEmail(email)) {
            throw new EmailConflictException(accessToken, provider.name());
        }

        // 3. 신규 가입
        User newUser = User.ofSocial(
            provider,
            profile.providerId(),
            profile.nickname(),
            email,
            profile.profileImageUrl()
        );
        User saved = userRepository.save(newUser);
        registrationLogger.log(saved.getUsername(), email, provider.name());
        String jwtToken = jwtTokenProvider.createToken(saved.getId(), saved.getUsername(), saved.getRole());
        return new SocialSignInResponse(jwtToken, true, saved.getNickname());
    }

    private OAuthClient resolveClient(OAuthProvider provider) {
        return switch (provider) {
            case KAKAO -> kakaoOAuthClient;
            case GOOGLE -> googleOAuthClient;
            default -> throw new AppException(ApiErrorCode.INVALID_REQUEST);
        };
    }

    private OAuthProvider resolveProvider(String provider) {
        try {
            return OAuthProvider.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ApiErrorCode.INVALID_REQUEST);
        }
    }
}
