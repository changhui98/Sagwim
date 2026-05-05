package com.peopleground.sagwim.image.presentation.dto.response;

import com.peopleground.sagwim.image.domain.entity.Image;
import com.peopleground.sagwim.image.domain.entity.ImageTargetType;
import java.time.LocalDateTime;

public record AdminImageResponse(
    Long id,
    String imageCode,
    String originalFilename,
    String fileUrl,
    ImageTargetType targetType,
    String targetId,
    String targetLabel,
    String uploaderUsername,
    long fileSize,
    String contentType,
    LocalDateTime createdDate
) {

    public static AdminImageResponse of(
        Image image,
        String resolvedUrl,
        String targetLabel,
        String uploaderUsername
    ) {
        return new AdminImageResponse(
            image.getId(),
            generateImageCode(image.getId()),
            image.getOriginalFilename(),
            resolvedUrl,
            image.getTargetType(),
            image.getTargetId(),
            targetLabel,
            uploaderUsername,
            image.getFileSize(),
            image.getContentType(),
            image.getCreatedDate()
        );
    }

    private static String generateImageCode(Long id) {
        long safe = id == null ? 0 : id;
        return String.format("SA-IMAGE-%04d-%04d", safe / 10000, safe % 10000);
    }
}
