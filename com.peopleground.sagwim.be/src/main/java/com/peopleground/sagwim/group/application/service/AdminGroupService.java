package com.peopleground.sagwim.group.application.service;

import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.GroupErrorCode;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.group.presentation.dto.response.AdminGroupResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminGroupService {

    private final GroupRepository groupRepository;

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

    private Group findGroup(Long groupId) {
        return groupRepository.findById(groupId)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_FOUND));
    }
}
