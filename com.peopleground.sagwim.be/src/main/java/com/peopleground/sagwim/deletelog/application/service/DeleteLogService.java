package com.peopleground.sagwim.deletelog.application.service;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.deletelog.domain.DeleteLogErrorCode;
import com.peopleground.sagwim.deletelog.domain.TargetType;
import com.peopleground.sagwim.deletelog.domain.entity.DeleteLog;
import com.peopleground.sagwim.deletelog.domain.repository.DeleteLogRepository;
import com.peopleground.sagwim.deletelog.presentation.dto.response.DeleteLogResponse;
import com.peopleground.sagwim.deletelog.presentation.dto.response.DeleteLogSummaryResponse;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeleteLogService {

    private final DeleteLogRepository deleteLogRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final ContentRepository contentRepository;

    /**
     * 소프트 딜리트 직후 호출. 삭제 서비스와 동일 트랜잭션에서 실행된다.
     */
    @Transactional
    public void log(String deletedBy, String targetType, String targetId, String targetSummary, String reason) {
        DeleteLog deleteLog = DeleteLog.of(deletedBy, targetType, targetId, targetSummary, reason);
        deleteLogRepository.save(deleteLog);
    }

    @Transactional(readOnly = true)
    public PageResponse<DeleteLogResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return PageResponse.from(
            deleteLogRepository.findAllOrderByDeletedAtDesc(pageable)
                .map(DeleteLogResponse::from)
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<DeleteLogResponse> findAll(LocalDate from, LocalDate to, int page, int size) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.atTime(LocalTime.MAX);
        Pageable pageable = PageRequest.of(page, size);
        return PageResponse.from(
            deleteLogRepository.findAllByDeletedAtBetweenOrderByDeletedAtDesc(fromDt, toDt, pageable)
                .map(DeleteLogResponse::from)
        );
    }

    @Transactional(readOnly = true)
    public DeleteLogSummaryResponse getSummary(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.atTime(LocalTime.MAX);

        long total = deleteLogRepository.countByDeletedAtBetween(fromDt, toDt);
        long restored = deleteLogRepository.countRestoredByDeletedAtBetween(fromDt, toDt);
        Map<String, Long> byTargetType = deleteLogRepository.countGroupByTargetTypeBetween(fromDt, toDt);

        return new DeleteLogSummaryResponse(total, byTargetType, restored, total - restored);
    }

    /**
     * 게시글/사용자/모임 관리 화면에서 직접 복원할 때 호출.
     * 해당 대상에 대한 미복원 로그 중 가장 최근 항목을 찾아 restored 처리한다.
     * 로그가 없으면 조용히 무시한다 (로그 없는 복원도 허용).
     */
    @Transactional
    public void markRestoredByTarget(String targetType, String targetId, String restoredBy) {
        deleteLogRepository.findTopByTargetTypeAndTargetIdAndRestoredFalse(targetType, targetId)
            .ifPresent(log -> log.markRestored(restoredBy));
    }

    /**
     * 복원 처리:
     * - DeleteLog.restored = true 기록
     * - targetType에 따라 해당 엔티티의 deletedDate / deletedBy 를 null 처리
     */
    @Transactional
    public DeleteLogResponse restore(Long logId, String restoredBy) {
        DeleteLog deleteLog = deleteLogRepository.findById(logId)
            .orElseThrow(() -> new AppException(DeleteLogErrorCode.DELETE_LOG_NOT_FOUND));

        if (deleteLog.isRestored()) {
            throw new AppException(DeleteLogErrorCode.ALREADY_RESTORED);
        }

        restoreTarget(deleteLog);
        deleteLog.markRestored(restoredBy);

        return DeleteLogResponse.from(deleteLog);
    }

    private void restoreTarget(DeleteLog deleteLog) {
        String targetType = deleteLog.getTargetType();
        String targetId = deleteLog.getTargetId();

        try {
            if (TargetType.USER.name().equals(targetType)) {
                User user = userRepository.findByUsername(targetId)
                    .orElseThrow(() -> new AppException(DeleteLogErrorCode.RESTORE_TARGET_NOT_FOUND));
                user.restore();

            } else if (TargetType.GROUP.name().equals(targetType)) {
                Long groupId = Long.parseLong(targetId);
                Group group = groupRepository.findByIdIncludingDeleted(groupId)
                    .orElseThrow(() -> new AppException(DeleteLogErrorCode.RESTORE_TARGET_NOT_FOUND));
                group.restore();

            } else if (TargetType.POST.name().equals(targetType)) {
                Long contentId = Long.parseLong(targetId);
                Content content = contentRepository.findByIdIncludingDeleted(contentId)
                    .orElseThrow(() -> new AppException(DeleteLogErrorCode.RESTORE_TARGET_NOT_FOUND));
                content.restore();
            }
            // IMAGE는 하드 딜리트이므로 복원 불가 — 로그만 기록
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(DeleteLogErrorCode.RESTORE_TARGET_NOT_FOUND);
        }
    }
}
