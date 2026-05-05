package com.peopleground.sagwim.image.application.service;

import com.peopleground.sagwim.comment.domain.entity.Comment;
import com.peopleground.sagwim.comment.domain.repository.CommentRepository;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.image.application.ImageUrlResolver;
import com.peopleground.sagwim.image.application.port.ImageStorage;
import com.peopleground.sagwim.image.domain.ImageErrorCode;
import com.peopleground.sagwim.image.domain.entity.Image;
import com.peopleground.sagwim.image.domain.repository.ImageRepository;
import com.peopleground.sagwim.image.presentation.dto.response.AdminImageResponse;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("imageAdminService")
@RequiredArgsConstructor
public class ImageAdminService {

    private final ImageRepository imageRepository;
    private final ContentRepository contentRepository;
    private final GroupRepository groupRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ImageUrlResolver imageUrlResolver;
    private final ImageStorage imageStorage;

    @Transactional(readOnly = true)
    public PageResponse<AdminImageResponse> getAllImagesForAdmin(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Image> images = imageRepository.findAllForAdmin(pageable);
        return PageResponse.from(images.map(this::toAdminResponse));
    }

    @Transactional
    public void deleteImageForAdmin(Long imageId) {
        Image image = imageRepository.findById(imageId)
            .orElseThrow(() -> new AppException(ImageErrorCode.IMAGE_NOT_FOUND));
        imageStorage.delete(image.getStoredFilename());
        clearImageReference(image);
        imageRepository.deleteById(imageId);
    }

    private void clearImageReference(Image image) {
        String resolvedUrl = imageUrlResolver.resolve(image.getFileUrl());
        switch (image.getTargetType()) {
            case USER -> {
                try {
                    UUID userId = UUID.fromString(image.getTargetId());
                    userRepository.findById(userId).ifPresent(u -> u.updateProfileImageUrl(null));
                } catch (Exception ignored) {}
            }
            case COMMENT -> {
                try {
                    Comment comment = commentRepository.findByImageUrl(resolvedUrl).orElse(null);
                    if (comment == null) {
                        comment = commentRepository.findByImageUrl(image.getFileUrl()).orElse(null);
                    }
                    if (comment != null) {
                        comment.clearImageUrl();
                    }
                } catch (Exception ignored) {}
            }
            case GROUP -> {
                try {
                    groupRepository.findById(Long.parseLong(image.getTargetId()))
                        .ifPresent(g -> g.updateImageUrl(null));
                } catch (Exception ignored) {}
            }
            case CONTENT -> {}
        }
    }

    private AdminImageResponse toAdminResponse(Image image) {
        String resolvedUrl = imageUrlResolver.resolve(image.getFileUrl());
        String targetLabel = resolveTargetLabel(image);
        String uploaderUsername = resolveUploaderUsername(image);
        return AdminImageResponse.of(image, resolvedUrl, targetLabel, uploaderUsername);
    }

    private String resolveTargetLabel(Image image) {
        return switch (image.getTargetType()) {
            case CONTENT -> {
                try {
                    Content content = contentRepository
                        .findByIdIncludingDeleted(Long.parseLong(image.getTargetId()))
                        .orElse(null);
                    if (content == null) {
                        yield "게시글 (삭제됨)";
                    }
                    String body = content.getBody();
                    yield "게시글: " + (body.length() > 40 ? body.substring(0, 40) + "..." : body);
                } catch (Exception e) {
                    yield "게시글";
                }
            }
            case USER -> "프로필 이미지";
            case GROUP -> {
                try {
                    Group group = groupRepository
                        .findById(Long.parseLong(image.getTargetId()))
                        .orElse(null);
                    yield group != null ? "모임: " + group.getName() : "모임 (삭제됨)";
                } catch (Exception e) {
                    yield "모임";
                }
            }
            case COMMENT -> {
                try {
                    String resolvedUrl = imageUrlResolver.resolve(image.getFileUrl());
                    Comment comment = commentRepository.findByImageUrl(resolvedUrl).orElse(null);
                    if (comment == null) {
                        comment = commentRepository.findByImageUrl(image.getFileUrl()).orElse(null);
                    }
                    yield comment != null
                        ? "댓글: " + (comment.getBody().length() > 30 ? comment.getBody().substring(0, 30) + "..." : comment.getBody())
                        : "댓글 이미지";
                } catch (Exception e) {
                    yield "댓글 이미지";
                }
            }
        };
    }

    private String resolveUploaderUsername(Image image) {
        return switch (image.getTargetType()) {
            case CONTENT -> {
                try {
                    Content content = contentRepository
                        .findByIdIncludingDeleted(Long.parseLong(image.getTargetId()))
                        .orElse(null);
                    yield content != null ? content.getUser().getUsername() : "알 수 없음";
                } catch (Exception e) {
                    yield "알 수 없음";
                }
            }
            case USER -> {
                try {
                    UUID userId = UUID.fromString(image.getTargetId());
                    User user = userRepository.findById(userId).orElse(null);
                    yield user != null ? user.getUsername() : "알 수 없음";
                } catch (Exception e) {
                    yield "알 수 없음";
                }
            }
            case GROUP -> {
                try {
                    Group group = groupRepository
                        .findById(Long.parseLong(image.getTargetId()))
                        .orElse(null);
                    yield group != null ? group.getLeader().getUsername() : "알 수 없음";
                } catch (Exception e) {
                    yield "알 수 없음";
                }
            }
            case COMMENT -> {
                try {
                    String resolvedUrl = imageUrlResolver.resolve(image.getFileUrl());
                    Comment comment = commentRepository.findByImageUrl(resolvedUrl).orElse(null);
                    if (comment == null) {
                        comment = commentRepository.findByImageUrl(image.getFileUrl()).orElse(null);
                    }
                    yield comment != null ? comment.getAuthor().getUsername() : "알 수 없음";
                } catch (Exception e) {
                    yield "알 수 없음";
                }
            }
        };
    }
}
