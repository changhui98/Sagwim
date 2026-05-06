package com.peopleground.sagwim.deletelog.application.service;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.deletelog.domain.DeleteLogErrorCode;
import com.peopleground.sagwim.deletelog.domain.TargetType;
import com.peopleground.sagwim.deletelog.domain.entity.DeleteLog;
import com.peopleground.sagwim.deletelog.domain.repository.DeleteLogRepository;
import com.peopleground.sagwim.deletelog.presentation.dto.response.DeleteLogResponse;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
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
