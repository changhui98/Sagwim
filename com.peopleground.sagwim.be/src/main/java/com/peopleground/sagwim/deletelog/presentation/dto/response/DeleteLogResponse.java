package com.peopleground.sagwim.deletelog.presentation.dto.response;

import com.peopleground.sagwim.deletelog.domain.entity.DeleteLog;
import java.time.LocalDateTime;

public record DeleteLogResponse(
    Long id,
    String deletedBy,
    String targetType,
    String targetId,
    String targetSummary,
    String reason,
    LocalDateTime deletedAt,
    boolean restored,
    LocalDateTime restoredAt,
    String restoredBy
) {
    public static DeleteLogResponse from(DeleteLog deleteLog) {
        return new DeleteLogResponse(
            deleteLog.getId(),
            deleteLog.getDeletedBy(),
            deleteLog.getTargetType(),
            deleteLog.getTargetId(),
            deleteLog.getTargetSummary(),
            deleteLog.getReason(),
            deleteLog.getDeletedAt(),
            deleteLog.isRestored(),
            deleteLog.getRestoredAt(),
            deleteLog.getRestoredBy()
        );
    }
}
