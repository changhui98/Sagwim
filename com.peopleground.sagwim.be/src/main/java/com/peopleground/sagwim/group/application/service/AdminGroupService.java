package com.peopleground.sagwim.group.application.service;

import com.peopleground.sagwim.deletelog.application.service.DeleteLogService;
import com.peopleground.sagwim.deletelog.domain.TargetType;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.GroupErrorCode;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.repository.GroupMemberRepository;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.group.presentation.dto.response.AdminGroupResponse;
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
public class AdminGroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final DeleteLogService deleteLogService;

    @Transactional(readOnly = true)
    public PageResponse<AdminGroupResponse> getAllGroups(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return PageResponse.from(
            groupRepository.findAllForAdmin(pageable).map(AdminGroupResponse::from)
        );
    }

    @Transactional
    public AdminGroupResponse approveGroup(Long groupId) {
        Group group = findGroup(groupId);
        if (!group.isPending()) {
            throw new AppException(GroupErrorCode.GROUP_NOT_PENDING);
        }
        group.approve();
        return AdminGroupResponse.from(group);
    }

    @Transactional
    public AdminGroupResponse rejectGroup(Long groupId) {
        Group group = findGroup(groupId);
        if (!group.isPending()) {
            throw new AppException(GroupErrorCode.GROUP_NOT_PENDING);
        }
        group.reject();
        return AdminGroupResponse.from(group);
    }

    @Transactional
    public void deleteGroup(Long groupId, CustomUser customUser, String reason) {
        Group group = findGroup(groupId);
        User admin = userRepository.findByUsername(customUser.getUsername())
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));

        groupMemberRepository.deleteAllByGroupId(groupId);
        group.delete(admin);

        deleteLogService.log(
            customUser.getUsername(),
            TargetType.GROUP.name(),
            String.valueOf(groupId),
            group.getName(),
            reason
        );
    }

    private Group findGroup(Long groupId) {
        return groupRepository.findById(groupId)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_FOUND));
    }
}
