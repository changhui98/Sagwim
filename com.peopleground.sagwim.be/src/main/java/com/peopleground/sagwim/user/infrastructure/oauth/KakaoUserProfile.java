package com.peopleground.sagwim.user.infrastructure.oauth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 카카오 사용자 프로필 응답 DTO
 * GET https://kapi.kakao.com/v2/user/me
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record KakaoUserProfile(
    Long id,
    @JsonProperty("kakao_account") KakaoAccount kakaoAccount
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record KakaoAccount(
        String email,
        Profile profile
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Profile(
        String nickname,
        @JsonProperty("profile_image_url") String profileImageUrl
    ) {}

    /**
     * nickname 반환 우선순위:
     *   1) kakao_account.profile.nickname (동의한 경우)
     *   2) kakao_account.name (이름 동의한 경우) — 현재 API 응답에 없으면 null
     *   3) email 앞부분 (@ 앞)
     *   4) "kakao_" + id 앞 6자리
     */
    public String nickname() {
        if (kakaoAccount != null && kakaoAccount.profile() != null) {
            String nick = kakaoAccount.profile().nickname();
            if (nick != null && !nick.isBlank()) {
                return nick;
            }
        }
        String email = email();
        if (email != null && email.contains("@")) {
            return email.substring(0, email.indexOf('@'));
        }
        if (id != null) {
            String idStr = String.valueOf(id);
            return "kakao_" + idStr.substring(0, Math.min(6, idStr.length()));
        }
        return "kakao_user";
    }

    public String email() {
        if (kakaoAccount != null) {
            return kakaoAccount.email();
        }
        return null;
    }

    public String profileImageUrl() {
        if (kakaoAccount != null && kakaoAccount.profile() != null) {
            return kakaoAccount.profile().profileImageUrl();
        }
        return null;
    }
}
