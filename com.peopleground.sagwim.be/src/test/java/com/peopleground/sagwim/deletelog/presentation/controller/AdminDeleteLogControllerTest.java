package com.peopleground.sagwim.deletelog.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.deletelog.application.service.DeleteLogService;
import com.peopleground.sagwim.deletelog.presentation.dto.response.DeleteLogResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class AdminDeleteLogControllerTest {

    @Mock DeleteLogService deleteLogService;
    @InjectMocks AdminDeleteLogController controller;

    private CustomUser adminUser;

    @BeforeEach
    void setUp() {
        adminUser = new CustomUser(UUID.randomUUID(), "admin", "pass", UserRole.ADMIN, true);
    }

    private DeleteLogResponse mockLog() {
        return new DeleteLogResponse(1L, "admin", "CONTENT", "1", "내용 요약", "위반", null, false, null, null);
    }

    @Test
    @DisplayName("삭제 로그 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getDeleteLogs_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 20, 0L, 0, false);
        given(deleteLogService.findAll(0, 20)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getDeleteLogs(0, 20, null, null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("삭제 항목 복원 성공")
    void restore_success() {
        given(deleteLogService.restore(eq(1L), anyString())).willReturn(mockLog());

        ResponseEntity<DeleteLogResponse> res = controller.restore(1L, adminUser);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).isNotNull();
    }

    @Test
    @DisplayName("삭제 항목 복원 - 없는 로그이면 예외 전파")
    void restore_notFound() {
        given(deleteLogService.restore(eq(999L), anyString()))
            .willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.restore(999L, adminUser))
            .isInstanceOf(AppException.class);
    }
}
