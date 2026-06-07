package com.peopleground.sagwim.report.application.service;

import com.peopleground.sagwim.comment.domain.CommentErrorCode;
import com.peopleground.sagwim.comment.domain.entity.Comment;
import com.peopleground.sagwim.comment.domain.repository.CommentRepository;
import com.peopleground.sagwim.content.domain.ContentErrorCode;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.report.domain.ReportErrorCode;
import com.peopleground.sagwim.report.domain.entity.Report;
import com.peopleground.sagwim.report.domain.entity.ReportTargetType;
import com.peopleground.sagwim.report.domain.repository.ReportRepository;
import com.peopleground.sagwim.report.presentation.dto.request.ReportCreateRequest;
import com.peopleground.sagwim.report.presentation.dto.response.AdminReportResponse;
import com.peopleground.sagwim.report.presentation.dto.response.ReportResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final ContentRepository contentRepository;
    private final CommentRepository commentRepository;

    /**
     * 신고를 생성한다.
     *
     * <p>규칙</p>
     * <ul>
     *   <li>본인이 작성한 게시글/댓글은 신고 불가 (자가 신고 방지).</li>
     *   <li>동일 유저가 동일 대상을 두 번 신고할 수 없다 (409 반환).</li>
     *   <li>신고 대상(게시글/댓글)이 존재하지 않으면 404 반환.</li>
     * </ul>
     */
    @Transactional
    public ReportResponse createReport(ReportCreateRequest req, CustomUser reporter) {
        UUID reporterUserId = reporter.getId();

        // 중복 신고 사전 검증
        if (reportRepository.existsByReporterUserIdAndTargetTypeAndTargetId(
            reporterUserId, req.targetType(), req.targetId())) {
            throw new AppException(ReportErrorCode.ALREADY_REPORTED);
        }

        // 대상 검증 및 자가 신고 방지
        validateTarget(req.targetType(), req.targetId(), reporterUserId);

        Report report = Report.of(reporterUserId, req.targetType(), req.targetId(), req.reason());
        Report saved = reportRepository.save(report);

        return ReportResponse.from(saved);
    }

    /**
     * 관리자 신고 목록 조회.
     *
     * <p>N+1 방지: ReportQueryRepository에서 IN 배치 조회로 처리한다.</p>
     */
    @Transactional(readOnly = true)
    public PageResponse<AdminReportResponse> getReportsForAdmin(int page, int size, String keyword, String searchField) {
        Pageable pageable = PageRequest.of(page, size);
        return PageResponse.from(reportRepository.findAllForAdmin(keyword, searchField, pageable));
    }

    /**
     * 신고 대상의 존재 여부를 확인하고 자가 신고를 방지한다.
     */
    private void validateTarget(ReportTargetType targetType, Long targetId, UUID reporterUserId) {
        if (targetType == ReportTargetType.POST) {
            Content content = contentRepository.findById(targetId)
                .orElseThrow(() -> new AppException(ReportErrorCode.REPORT_TARGET_NOT_FOUND));

            if (content.isDeleted()) {
                throw new AppException(ReportErrorCode.REPORT_TARGET_NOT_FOUND);
            }

            // 자가 신고 방지: 게시글 작성자의 userId와 신고자 UUID 비교
            if (content.getUser().getId().equals(reporterUserId)) {
                throw new AppException(ReportErrorCode.SELF_REPORT_NOT_ALLOWED);
            }
        } else if (targetType == ReportTargetType.COMMENT) {
            Comment comment = commentRepository.findById(targetId)
                .orElseThrow(() -> new AppException(ReportErrorCode.REPORT_TARGET_NOT_FOUND));

            if (comment.isDeleted()) {
                throw new AppException(ReportErrorCode.REPORT_TARGET_NOT_FOUND);
            }

            // 자가 신고 방지: 댓글 작성자의 userId와 신고자 UUID 비교
            if (comment.getAuthor().getId().equals(reporterUserId)) {
                throw new AppException(ReportErrorCode.SELF_REPORT_NOT_ALLOWED);
            }
        }
        // MESSAGE 등 추후 타입은 별도 처리
    }
}
