package com.peopleground.sagwim.moderation.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ModerationErrorCode implements ErrorCode {

    BAD_WORD_INCLUDED(HttpStatus.BAD_REQUEST, "M001", "사용할 수 없는 단어가 포함되어 있습니다."),
    FORBIDDEN_WORD_NOT_FOUND(HttpStatus.NOT_FOUND, "M002", "금지 단어가 존재하지 않습니다."),
    FORBIDDEN_WORD_ALREADY_EXISTS(HttpStatus.CONFLICT, "M003", "이미 등록된 금지 단어입니다."),
    FORBIDDEN_WORD_BLANK(HttpStatus.BAD_REQUEST, "M004", "금지 단어를 입력해주세요."),
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;
}
