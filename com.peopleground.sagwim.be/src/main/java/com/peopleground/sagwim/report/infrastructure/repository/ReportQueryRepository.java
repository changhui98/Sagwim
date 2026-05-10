package com.peopleground.sagwim.report.infrastructure.repository;

import com.peopleground.sagwim.comment.domain.entity.Comment;
import com.peopleground.sagwim.comment.domain.entity.QComment;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.entity.QContent;
import com.peopleground.sagwim.report.domain.entity.Report;
import com.peopleground.sagwim.report.domain.entity.ReportTargetType;
import com.peopleground.sagwim.report.presentation.dto.response.AdminReportResponse;
import com.peopleground.sagwim.user.domain.entity.QUser;
import com.peopleground.sagwim.user.domain.entity.User;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

/**
 * 신고 관리자 목록 N+1 방지 전략:
 *
 * <ol>
 *   <li>Report 페이지를 먼저 조회한다 (reportJpaRepository 위임).</li>
 *   <li>targetType 별로 targetId 목록을 분리하여 Content / Comment를 IN 쿼리로 일괄 조회한다.</li>
 *   <li>reporterUserId 목록으로 User를 IN 쿼리로 일괄 조회한다.</li>
 *   <li>메모리에서 결합하여 AdminReportResponse 리스트를 구성한다.</li>
 * </ol>
 *
 * 이 방식으로 Report N건 조회 시 추가 쿼리 수가 O(N)에서 O(1)로 감소한다.
 */
@Repository
@RequiredArgsConstructor
public class ReportQueryRepository {

    private static final String DELETED_CONTENT_PLACEHOLDER = "(삭제된 콘텐츠)";

    private final JPAQueryFactory queryFactory;
    private final ReportJpaRepository reportJpaRepository;

    /**
     * 신고 목록 관리자 페이지 조회.
     * createdDate 내림차순 정렬로 최신 신고가 먼저 표시된다.
     */
    public Page<AdminReportResponse> findAllForAdmin(Pageable pageable) {
        // 1. Report 페이지 조회 (단순 JPA — Pageable 자체 페이징)
        org.springframework.data.domain.Page<Report> reportPage =
            reportJpaRepository.findAllByOrderByCreatedDateDesc(pageable);

        List<Report> reports = reportPage.getContent();
        if (reports.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        // 2. targetId를 targetType별로 분리
        List<Long> postIds = reports.stream()
            .filter(r -> r.getTargetType() == ReportTargetType.POST)
            .map(Report::getTargetId)
            .distinct()
            .toList();

        List<Long> commentIds = reports.stream()
            .filter(r -> r.getTargetType() == ReportTargetType.COMMENT)
            .map(Report::getTargetId)
            .distinct()
            .toList();

        // 3. Content IN 쿼리 (삭제된 것도 포함 — isDeleted 여부는 placeholder로 처리)
        Map<Long, String> contentBodyMap = fetchContentBodies(postIds);

        // 4. Comment IN 쿼리 (삭제된 것도 포함)
        Map<Long, String> commentBodyMap = fetchCommentBodies(commentIds);

        // 5. Reporter User IN 쿼리
        List<UUID> reporterIds = reports.stream()
            .map(Report::getReporterUserId)
            .distinct()
            .toList();
        Map<UUID, User> reporterMap = fetchUsers(reporterIds);

        // 6. 메모리 결합
        List<AdminReportResponse> result = reports.stream()
            .map(report -> {
                String targetContent = resolveTargetContent(report, contentBodyMap, commentBodyMap);
                User reporter = reporterMap.get(report.getReporterUserId());
                String reporterId = reporter != null ? reporter.getUsername() : String.valueOf(report.getReporterUserId());
                String reporterNickname = reporter != null ? reporter.getNickname() : "알 수 없음";

                return new AdminReportResponse(
                    report.getId(),
                    report.getTargetType().name(),
                    report.getTargetId(),
                    targetContent,
                    reporterId,
                    reporterNickname,
                    report.getReason(),
                    report.getCreatedDate()
                );
            })
            .toList();

        return new PageImpl<>(result, pageable, reportPage.getTotalElements());
    }

    private String resolveTargetContent(
        Report report,
        Map<Long, String> contentBodyMap,
        Map<Long, String> commentBodyMap
    ) {
        if (report.getTargetType() == ReportTargetType.POST) {
            return contentBodyMap.getOrDefault(report.getTargetId(), DELETED_CONTENT_PLACEHOLDER);
        }
        if (report.getTargetType() == ReportTargetType.COMMENT) {
            return commentBodyMap.getOrDefault(report.getTargetId(), DELETED_CONTENT_PLACEHOLDER);
        }
        // MESSAGE 등 추후 타입은 placeholder
        return DELETED_CONTENT_PLACEHOLDER;
    }

    /**
     * 게시글 ID 목록으로 body를 IN 쿼리 한 번에 조회한다.
     * 삭제된 게시글은 body가 null이 아니므로 포함, deletedDate가 있으면 placeholder로 표시.
     */
    private Map<Long, String> fetchContentBodies(List<Long> postIds) {
        if (postIds.isEmpty()) {
            return Map.of();
        }

        QContent content = QContent.content;

        List<Content> contents = queryFactory
            .selectFrom(content)
            .where(content.id.in(postIds))
            .fetch();

        return contents.stream().collect(Collectors.toMap(
            Content::getId,
            c -> c.isDeleted() ? DELETED_CONTENT_PLACEHOLDER : c.getBody()
        ));
    }

    /**
     * 댓글 ID 목록으로 body를 IN 쿼리 한 번에 조회한다.
     */
    private Map<Long, String> fetchCommentBodies(List<Long> commentIds) {
        if (commentIds.isEmpty()) {
            return Map.of();
        }

        QComment comment = QComment.comment;

        List<Comment> comments = queryFactory
            .selectFrom(comment)
            .where(comment.id.in(commentIds))
            .fetch();

        return comments.stream().collect(Collectors.toMap(
            Comment::getId,
            c -> c.isDeleted() ? DELETED_CONTENT_PLACEHOLDER : c.getBody()
        ));
    }

    /**
     * 신고자 UUID 목록으로 User를 IN 쿼리 한 번에 조회한다.
     */
    private Map<UUID, User> fetchUsers(List<UUID> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }

        QUser user = QUser.user;

        List<User> users = queryFactory
            .selectFrom(user)
            .where(user.id.in(userIds))
            .fetch();

        return users.stream().collect(Collectors.toMap(
            User::getId,
            Function.identity()
        ));
    }
}
