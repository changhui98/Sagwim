package com.peopleground.sagwim.content.application.service;

import com.peopleground.sagwim.content.domain.ContentErrorCode;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.content.presentation.dto.request.AdminContentUpdateRequest;
import com.peopleground.sagwim.content.presentation.dto.response.AdminContentResponse;
import com.peopleground.sagwim.deletelog.application.service.DeleteLogService;
import com.peopleground.sagwim.deletelog.domain.TargetType;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminContentService {

    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final DeleteLogService deleteLogService;

    @Transactional(readOnly = true)
    public PageResponse<AdminContentResponse> getAllContents(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size);

        if (keyword != null && !keyword.isBlank()) {
            return PageResponse.from(
                contentRepository.searchContentsIncludingDeleted(keyword, pageable)
                    .map(AdminContentResponse::from)
            );
        }

        return PageResponse.from(
            contentRepository.findAllContentsIncludingDeleted(pageable)
                .map(AdminContentResponse::from)
        );
    }

    @Transactional(readOnly = true)
    public AdminContentResponse getContent(Long contentId) {
        Content content = getContentIncludingDeleted(contentId);
        return AdminContentResponse.from(content);
    }

    @Transactional
    public AdminContentResponse updateContent(Long contentId, AdminContentUpdateRequest req) {
        Content content = getContentIncludingDeleted(contentId);

        if (content.isDeleted()) {
            throw new AppException(ContentErrorCode.CONTENT_ALREADY_DELETED);
        }

        content.update(req.body());
        return AdminContentResponse.from(content);
    }

    @Transactional
    public void deleteContent(Long contentId, CustomUser adminUser, String reason) {
        Content content = getContentIncludingDeleted(contentId);

        if (content.isDeleted()) {
            throw new AppException(ContentErrorCode.CONTENT_ALREADY_DELETED);
        }

        User user = userRepository.findByUsername(adminUser.getUsername())
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));

        content.deleteBy(user);

        String body = content.getBody();
        String summary = body.length() > 20 ? body.substring(0, 20) + "..." : body;
        deleteLogService.log(
            adminUser.getUsername(),
            TargetType.POST.name(),
            String.valueOf(contentId),
            summary,
            reason
        );
    }

    @Transactional
    public AdminContentResponse restoreContent(Long contentId, String restoredBy) {
        Content content = getContentIncludingDeleted(contentId);

        if (!content.isDeleted()) {
            throw new AppException(ContentErrorCode.CONTENT_NOT_DELETED);
        }

        content.restore();
        deleteLogService.markRestoredByTarget(TargetType.POST.name(), String.valueOf(contentId), restoredBy);
        return AdminContentResponse.from(content);
    }

    private Content getContentIncludingDeleted(Long contentId) {
        return contentRepository.findByIdIncludingDeleted(contentId)
            .orElseThrow(() -> new AppException(ContentErrorCode.CONTENT_NOT_FOUND));
    }
}
