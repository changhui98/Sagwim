package com.peopleground.sagwim.inquiry.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.inquiry.application.service.InquiryService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class AdminInquiryControllerTest {

    @Mock InquiryService inquiryService;
    @InjectMocks AdminInquiryController controller;

    @Test
    @DisplayName("관리자 문의 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getInquiries_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 20, 0L, 0, false);
        given(inquiryService.getInquiriesForAdmin(0, 20)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getInquiries(0, 20);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("관리자 문의 목록 조회 - 다른 페이지")
    @SuppressWarnings("unchecked")
    void getInquiries_page2() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 1, 20, 25L, 2, false);
        given(inquiryService.getInquiriesForAdmin(1, 20)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getInquiries(1, 20);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
