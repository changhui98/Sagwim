package com.peopleground.sagwim.deletelog.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "delete_log")
@Table(
    name = "delete_log",
    indexes = {
        @Index(name = "idx_delete_log_deleted_at",  columnList = "deleted_at DESC"),
        @Index(name = "idx_delete_log_target_type", columnList = "target_type")
    }
)
public class DeleteLog {

    private static final Clock KST_CLOCK = Clock.system(ZoneId.of("Asia/Seoul"));

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "deleted_by", nullable = false, length = 50)
    private String deletedBy;

    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType;

    @Column(name = "target_id", nullable = false, length = 100)
    private String targetId;

    @Column(name = "target_summary", nullable = false, length = 255)
    private String targetSummary;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "deleted_at", nullable = false)
    private LocalDateTime deletedAt;

    @Column(name = "restored", nullable = false)
    private boolean restored = false;

    @Column(name = "restored_at")
    private LocalDateTime restoredAt;

    @Column(name = "restored_by", length = 50)
    private String restoredBy;

    public static DeleteLog of(
        String deletedBy,
        String targetType,
        String targetId,
        String targetSummary,
        String reason
    ) {
        DeleteLog log = new DeleteLog();
        log.deletedBy = deletedBy;
        log.targetType = targetType;
        log.targetId = targetId;
        log.targetSummary = targetSummary;
        log.reason = reason;
        log.deletedAt = LocalDateTime.now(KST_CLOCK);
        log.restored = false;
        return log;
    }

    public void markRestored(String restoredBy) {
        this.restored = true;
        this.restoredAt = LocalDateTime.now(KST_CLOCK);
        this.restoredBy = restoredBy;
    }
}
