package com.peopleground.sagwim.notification.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum NotificationErrorCode implements ErrorCode {

    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "NT001", "존재하지 않는 알림입니다."),
    NOTIFICATION_FORBIDDEN(HttpStatus.FORBIDDEN, "NT002", "알림에 접근할 권한이 없습니다."),
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;
}
