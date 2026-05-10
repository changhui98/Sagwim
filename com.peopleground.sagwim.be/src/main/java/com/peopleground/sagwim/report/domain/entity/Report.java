package com.peopleground.sagwim.report.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 신고 엔티티.
 *
 * <ul>
 *   <li>한 유저는 동일 대상(targetType + targetId)에 한 번만 신고 가능하다.
 *       DB 레벨의 UNIQUE 제약(uq_report_reporter_target)으로 보장하며
 *       서비스 레이어에서도 사전 검증한다.</li>
 *   <li>BaseEntity 상속: createdDate / lastModifiedDate / deletedDate 자동 관리.</li>
 * </ul>
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "report")
@Table(
    name = "report",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_report_reporter_target",
            columnNames = {"reporter_user_id", "target_type", "target_id"}
        )
    },
    indexes = {
        @Index(name = "idx_report_target_type_id",   columnList = "target_type, target_id"),
        @Index(name = "idx_report_reporter_user_id", columnList = "reporter_user_id"),
        @Index(name = "idx_report_created_date",     columnList = "created_date DESC")
    }
)
public class Report extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporter_user_id", nullable = false)
    private UUID reporterUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private ReportTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status = ReportStatus.PENDING;

    public static Report of(
        UUID reporterUserId,
        ReportTargetType targetType,
        Long targetId,
        String reason
    ) {
        Report report = new Report();
        report.reporterUserId = reporterUserId;
        report.targetType = targetType;
        report.targetId = targetId;
        report.reason = reason;
        report.status = ReportStatus.PENDING;
        return report;
    }
}
