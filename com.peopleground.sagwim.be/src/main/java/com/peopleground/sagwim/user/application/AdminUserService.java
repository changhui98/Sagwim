package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.deletelog.application.service.DeleteLogService;
import com.peopleground.sagwim.deletelog.domain.TargetType;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.image.application.ImageUrlResolver;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import com.peopleground.sagwim.user.presentation.dto.response.AdminUserDetailResponse;
import com.peopleground.sagwim.user.presentation.dto.response.AdminUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final ImageUrlResolver imageUrlResolver;
    private final DeleteLogService deleteLogService;

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> getUsersForAdmin(int page, int size, String keyword, String searchField) {
        Pageable pageable = PageRequest.of(page, size);

        return PageResponse.from(
            userRepository.findAllUserForAdmin(keyword, searchField, pageable)
                .map(user -> AdminUserResponse.from(user, imageUrlResolver.resolve(user.getProfileImageUrl())))
        );
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserForAdmin(String username) {

        return AdminUserDetailResponse.from(getUser(username));
    }

    @Transactional
    public void deleteUserForAdmin(String requesterUsername, String targetUsername, String reason) {

        User user = getUser(targetUsername);
        user.delete();

        deleteLogService.log(
            requesterUsername,
            TargetType.USER.name(),
            user.getUsername(),
            user.getUsername() + " (" + user.getNickname() + ")",
            reason
        );
    }

    @Transactional
    public AdminUserDetailResponse restoreUserForAdmin(String requesterUsername, String targetUsername) {
        User user = getUser(targetUsername);

        if (!user.isDeleted()) {
            throw new AppException(UserErrorCode.USER_NOT_DELETED);
        }

        user.restore();
        deleteLogService.markRestoredByTarget(TargetType.USER.name(), user.getUsername(), requesterUsername);
        return AdminUserDetailResponse.from(user);
    }

    @Transactional
    public void changeUserRole(String requesterUsername, String targetUsername, UserRole newRole) {

        if (newRole == UserRole.ADMIN) {
            throw new AppException(UserErrorCode.CANNOT_ASSIGN_ADMIN_ROLE);
        }

        if (requesterUsername.equals(targetUsername)) {
            throw new AppException(UserErrorCode.CANNOT_CHANGE_OWN_ROLE);
        }

        User target = getUser(targetUsername);
        target.changeRole(newRole);
    }

    private User getUser(String username) {

        return userRepository.findByUsername(username).orElseThrow(
            () -> new AppException(UserErrorCode.USER_NOT_FOUND)
        );
    }
}
