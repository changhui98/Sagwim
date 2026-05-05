package com.peopleground.sagwim.user.presentation.dto.request;

public record SocialLinkRequest(
    String provider,
    String accessToken
) {}
