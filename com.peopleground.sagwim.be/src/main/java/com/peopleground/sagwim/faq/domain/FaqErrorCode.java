package com.peopleground.sagwim.faq.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum FaqErrorCode implements ErrorCode {

    FAQ_NOT_FOUND(HttpStatus.NOT_FOUND, "FAQ001", "FAQ가 존재하지 않습니다."),
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;
}
