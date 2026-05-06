package com.peopleground.sagwim.deletelog.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum DeleteLogErrorCode implements ErrorCode {

    DELETE_LOG_NOT_FOUND(HttpStatus.NOT_FOUND, "DL_001", "삭제 로그를 찾을 수 없습니다."),
    ALREADY_RESTORED(HttpStatus.CONFLICT, "DL_002", "이미 복원된 항목입니다."),
    RESTORE_TARGET_NOT_FOUND(HttpStatus.NOT_FOUND, "DL_003", "복원할 대상을 찾을 수 없습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
