package com.peopleground.sagwim.user.infrastructure.oauth;

import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.application.port.OAuthClient;
import com.peopleground.sagwim.user.application.port.OAuthUserProfile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;

@Slf4j
@Component("kakaoOAuthClient")
public class KakaoOAuthClient implements OAuthClient {

    @Value("${oauth2.kakao.client-id:}")
    private String clientId;

    @Value("${oauth2.kakao.client-secret:}")
    private String clientSecret;

    private final WebClient authClient = WebClient.create("https://kauth.kakao.com");
    private final WebClient apiClient = WebClient.create("https://kapi.kakao.com");

    /**
     * 인가 코드로 카카오 액세스 토큰을 교환한다.
     *
     * <p>실패 시 OAUTH_TOKEN_EXCHANGE_FAILED 를 던지며, 디버깅을 위해 카카오가 반환한
     * 실제 응답 본문을 ERROR 로그로 남긴다 (client_id/redirect_uri 불일치 등 원인 식별).</p>
     */
    public String exchangeToken(String code, String redirectUri) {
        if (clientId == null || clientId.isBlank()) {
            log.error("[KakaoOAuthClient] KAKAO_CLIENT_ID 환경변수가 설정되지 않았습니다.");
            throw new AppException(ApiErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED);
        }

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("redirect_uri", redirectUri);
        params.add("code", code);
        if (clientSecret != null && !clientSecret.isBlank()) {
            params.add("client_secret", clientSecret);
        }

        try {
            Map<?, ?> response = authClient.post()
                .uri("/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(params))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (response == null || !response.containsKey("access_token")) {
                log.error("[KakaoOAuthClient] 토큰 응답에 access_token 이 없습니다. response={}", response);
                throw new AppException(ApiErrorCode.OAUTH_TOKEN_EXCHANGE_FAILED);
            }

            return (String) response.get("access_token");
        } catch (AppException e) {
            throw e;
        } catch (WebClientResponseException e) {
            log.error("[KakaoOAuthClient] 토큰 교환 실패 status={} body={} redirectUri={}",
                e.getStatusCode(), e.getResponseBodyAsString(), redirectUri);
            throw new AppException(ApiErrorCode.OAUTH_TOKEN_EXCHANGE_FAILED);
        } catch (Exception e) {
            log.error("[KakaoOAuthClient] 토큰 교환 중 예외 redirectUri={}", redirectUri, e);
            throw new AppException(ApiErrorCode.OAUTH_TOKEN_EXCHANGE_FAILED);
        }
    }

    /**
     * 카카오 액세스 토큰으로 사용자 프로필을 조회한다.
     */
    public KakaoUserProfile getUserProfile(String accessToken) {
        try {
            return apiClient.get()
                .uri("/v2/user/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(KakaoUserProfile.class)
                .block();
        } catch (WebClientResponseException e) {
            log.error("[KakaoOAuthClient] 프로필 조회 실패 status={} body={}",
                e.getStatusCode(), e.getResponseBodyAsString());
            throw new AppException(ApiErrorCode.OAUTH_PROFILE_FETCH_FAILED);
        } catch (Exception e) {
            log.error("[KakaoOAuthClient] 프로필 조회 중 예외", e);
            throw new AppException(ApiErrorCode.OAUTH_PROFILE_FETCH_FAILED);
        }
    }

    @Override
    public OAuthUserProfile fetchUserProfile(String accessToken) {
        KakaoUserProfile profile = getUserProfile(accessToken);
        String providerId = String.valueOf(profile.id());
        return new OAuthUserProfile(
            providerId,
            profile.nickname(),
            profile.email(),
            profile.profileImageUrl()
        );
    }
}
