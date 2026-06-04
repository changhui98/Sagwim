package com.peopleground.sagwim.report.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.peopleground.sagwim.comment.domain.entity.Comment;
import com.peopleground.sagwim.comment.domain.repository.CommentRepository;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.report.domain.entity.Report;
import com.peopleground.sagwim.report.domain.entity.ReportTargetType;
import com.peopleground.sagwim.report.domain.repository.ReportRepository;
import com.peopleground.sagwim.report.presentation.dto.request.ReportCreateRequest;
import com.peopleground.sagwim.report.presentation.dto.response.ReportResponse;
import com.peopleground.sagwim.user.domain.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReportService 단위 테스트")
class ReportServiceTest {

    @Mock private ReportRepository reportRepository;
    @Mock private ContentRepository contentRepository;
    @Mock private CommentRepository commentRepository;

    @InjectMocks private ReportService reportService;

    private CustomUser reporter(UUID id) {
        return new CustomUser(id, "reporter", null, null, true);
    }

    private ReportCreateRequest request(ReportTargetType type, Long targetId) {
        return new ReportCreateRequest(type, targetId, "신고 사유입니다");
    }

    @Test
    @DisplayName("이미 신고한 대상을 다시 신고하면 예외를 던진다")
    void createReport_duplicate_throws() {
        // given
        UUID reporterId = UUID.randomUUID();
        given(reportRepository.existsByReporterUserIdAndTargetTypeAndTargetId(reporterId, ReportTargetType.POST, 1L))
            .willReturn(true);

        // when & then
        assertThatThrownBy(() -> reportService.createReport(request(ReportTargetType.POST, 1L), reporter(reporterId)))
            .isInstanceOf(AppException.class);
        verify(reportRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    @DisplayName("신고 대상 게시글이 존재하지 않으면 예외를 던진다")
    void createReport_targetNotFound_throws() {
        // given
        UUID reporterId = UUID.randomUUID();
        given(reportRepository.existsByReporterUserIdAndTargetTypeAndTargetId(reporterId, ReportTargetType.POST, 1L))
            .willReturn(false);
        given(contentRepository.findById(1L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> reportService.createReport(request(ReportTargetType.POST, 1L), reporter(reporterId)))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("이미 삭제된 게시글은 신고할 수 없다")
    void createReport_deletedTarget_throws() {
        // given
        UUID reporterId = UUID.randomUUID();
        Content content = org.mockito.Mockito.mock(Content.class);
        given(content.isDeleted()).willReturn(true);
        given(reportRepository.existsByReporterUserIdAndTargetTypeAndTargetId(reporterId, ReportTargetType.POST, 1L))
            .willReturn(false);
        given(contentRepository.findById(1L)).willReturn(Optional.of(content));

        // when & then
        assertThatThrownBy(() -> reportService.createReport(request(ReportTargetType.POST, 1L), reporter(reporterId)))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("본인이 작성한 게시글은 신고할 수 없다 (자가 신고 방지)")
    void createReport_selfReport_throws() {
        // given
        UUID reporterId = UUID.randomUUID();
        User author = org.mockito.Mockito.mock(User.class);
        given(author.getId()).willReturn(reporterId); // 작성자 == 신고자
        Content content = org.mockito.Mockito.mock(Content.class);
        given(content.isDeleted()).willReturn(false);
        given(content.getUser()).willReturn(author);

        given(reportRepository.existsByReporterUserIdAndTargetTypeAndTargetId(reporterId, ReportTargetType.POST, 1L))
            .willReturn(false);
        given(contentRepository.findById(1L)).willReturn(Optional.of(content));

        // when & then
        assertThatThrownBy(() -> reportService.createReport(request(ReportTargetType.POST, 1L), reporter(reporterId)))
            .isInstanceOf(AppException.class);
        verify(reportRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    @DisplayName("정상 신고 - 게시글 신고를 저장하고 응답을 반환한다")
    void createReport_validPost_saves() {
        // given
        UUID reporterId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        User author = org.mockito.Mockito.mock(User.class);
        given(author.getId()).willReturn(authorId);
        Content content = org.mockito.Mockito.mock(Content.class);
        given(content.isDeleted()).willReturn(false);
        given(content.getUser()).willReturn(author);

        given(reportRepository.existsByReporterUserIdAndTargetTypeAndTargetId(reporterId, ReportTargetType.POST, 1L))
            .willReturn(false);
        given(contentRepository.findById(1L)).willReturn(Optional.of(content));
        given(reportRepository.save(any(Report.class))).willAnswer(returnsFirstArg());

        // when
        ReportResponse response = reportService.createReport(request(ReportTargetType.POST, 1L), reporter(reporterId));

        // then
        assertThat(response).isNotNull();
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    @DisplayName("본인이 작성한 댓글은 신고할 수 없다 (자가 신고 방지)")
    void createReport_selfReportComment_throws() {
        // given
        UUID reporterId = UUID.randomUUID();
        User author = org.mockito.Mockito.mock(User.class);
        given(author.getId()).willReturn(reporterId);
        Comment comment = org.mockito.Mockito.mock(Comment.class);
        given(comment.isDeleted()).willReturn(false);
        given(comment.getAuthor()).willReturn(author);

        given(reportRepository.existsByReporterUserIdAndTargetTypeAndTargetId(reporterId, ReportTargetType.COMMENT, 1L))
            .willReturn(false);
        given(commentRepository.findById(1L)).willReturn(Optional.of(comment));

        // when & then
        assertThatThrownBy(() -> reportService.createReport(request(ReportTargetType.COMMENT, 1L), reporter(reporterId)))
            .isInstanceOf(AppException.class);
    }
}
