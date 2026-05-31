package com.peopleground.sagwim.group.application.service;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.GroupErrorCode;
import com.peopleground.sagwim.group.domain.GroupWithLiked;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.GroupJoinRequest;
import com.peopleground.sagwim.group.domain.entity.GroupJoinRequestStatus;
import com.peopleground.sagwim.group.domain.entity.GroupJoinType;
import com.peopleground.sagwim.group.domain.entity.GroupMeetingType;
import com.peopleground.sagwim.group.domain.entity.GroupMember;
import com.peopleground.sagwim.group.domain.entity.GroupMemberRole;
import com.peopleground.sagwim.group.domain.entity.GroupJoinQuestion;
import com.peopleground.sagwim.group.domain.repository.GroupJoinQuestionRepository;
import com.peopleground.sagwim.group.domain.repository.GroupJoinRequestRepository;
import com.peopleground.sagwim.group.domain.repository.GroupMemberRepository;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.group.presentation.dto.request.GroupCreateRequest;
import com.peopleground.sagwim.group.presentation.dto.request.GroupJoinQuestionsUpdateRequest;
import com.peopleground.sagwim.group.presentation.dto.request.GroupUpdateRequest;
import com.peopleground.sagwim.group.presentation.dto.response.GroupDetailResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupJoinRequestResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupMemberResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupResponse;
import com.peopleground.sagwim.image.application.ImageUrlResolver;
import com.peopleground.sagwim.image.application.service.ImageService;
import com.peopleground.sagwim.image.domain.entity.ImageTargetType;
import com.peopleground.sagwim.image.presentation.dto.response.ImageResponse;
import com.peopleground.sagwim.notification.application.service.NotificationService;
import com.peopleground.sagwim.notification.domain.entity.NotificationType;
import com.peopleground.sagwim.schedule.domain.repository.ScheduleRepository;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import com.peopleground.sagwim.user.infrastructure.GeocodingClient;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupJoinRequestRepository joinRequestRepository;
    private final GroupJoinQuestionRepository joinQuestionRepository;
    private final UserRepository userRepository;
    private final ImageService imageService;
    private final ImageUrlResolver imageUrlResolver;
    private final NotificationService notificationService;
    private final GeocodingClient geocodingClient;
    private final GeometryFactory geometryFactory;
    private final ScheduleRepository scheduleRepository;

    @Transactional
    public GroupResponse createGroup(GroupCreateRequest request, CustomUser customUser) {
        User leader = getUser(customUser.getUsername());

        if (request.meetingType() == GroupMeetingType.OFFLINE
                && (leader.getAddress() == null || leader.getAddress().isBlank())) {
            throw new AppException(GroupErrorCode.LEADER_ADDRESS_REQUIRED);
        }

        Group group = Group.of(
            request.name(),
            request.description(),
            request.category(),
            request.subCategories(),
            request.meetingType(),
            request.meetingType() == GroupMeetingType.OFFLINE ? leader.getAddress() : null,
            request.maxMemberCount(),
            leader
        );

        if (request.joinType() != null) {
            group.updateJoinType(request.joinType());
        }

        Group saved = groupRepository.save(group);

        if (group.getMeetingType() == GroupMeetingType.OFFLINE && group.getRegion() != null) {
            geocodeAndSetLocation(saved, group.getRegion());
        }

        // 생성자를 자동으로 LEADER로 등록
        GroupMember leaderMember = GroupMember.of(saved, leader, GroupMemberRole.LEADER);
        groupMemberRepository.save(leaderMember);
        groupRepository.incrementMemberCount(saved.getId());

        return GroupResponse.from(saved, imageUrlResolver.resolve(saved.getImageUrl()));
    }

    @Transactional(readOnly = true)
    public PageResponse<GroupResponse> getGroups(int page, int size, String keyword, GroupCategory category, CustomUser customUser) {
        User user = getUser(customUser.getUsername());
        List<GroupWithLiked> raw = new ArrayList<>(groupRepository.findAll(page, size, keyword, category, customUser.getId(), user.getLocation(), user.getExposureRangeKm()));
        boolean hasNext = PageResponse.trim(raw, size);
        List<GroupResponse> responses = raw.stream()
            .map(gw -> GroupResponse.from(gw.group(), imageUrlResolver.resolve(gw.group().getImageUrl()), gw.liked()))
            .toList();
        return PageResponse.ofSlice(responses, page, size, hasNext);
    }

    /**
     * 생성된 지 7일 미만인 신규 모임 목록을 조회합니다.
     * OFFLINE 모임은 사용자의 노출 범위(km) 이내인 것만 포함합니다.
     * COUNT 쿼리 없이 size+1 방식.
     */
    @Transactional(readOnly = true)
    public PageResponse<GroupResponse> getNewGroups(int page, int size, CustomUser customUser) {
        User user = getUser(customUser.getUsername());
        List<GroupWithLiked> raw = new ArrayList<>(groupRepository.findNewGroups(page, size, customUser.getId(), user.getLocation(), user.getExposureRangeKm()));
        boolean hasNext = PageResponse.trim(raw, size);
        List<GroupResponse> responses = raw.stream()
            .map(gw -> GroupResponse.from(gw.group(), imageUrlResolver.resolve(gw.group().getImageUrl()), gw.liked()))
            .toList();
        return PageResponse.ofSlice(responses, page, size, hasNext);
    }

    /**
     * 좋아요 수 내림차순으로 인기 모임 목록을 조회합니다.
     * OFFLINE 모임은 사용자의 노출 범위(km) 이내인 것만 포함합니다.
     * COUNT 쿼리 없이 size+1 방식.
     */
    @Transactional(readOnly = true)
    public PageResponse<GroupResponse> getPopularGroups(int page, int size, CustomUser customUser) {
        User user = getUser(customUser.getUsername());
        List<GroupWithLiked> raw = new ArrayList<>(groupRepository.findPopularGroups(page, size, customUser.getId(), user.getLocation(), user.getExposureRangeKm()));
        boolean hasNext = PageResponse.trim(raw, size);
        List<GroupResponse> responses = raw.stream()
            .map(gw -> GroupResponse.from(gw.group(), imageUrlResolver.resolve(gw.group().getImageUrl()), gw.liked()))
            .toList();
        return PageResponse.ofSlice(responses, page, size, hasNext);
    }

    /**
     * 정원이 거의 다 찬(마감 임박) 모임 목록을 조회합니다.
     * OFFLINE 모임은 사용자의 노출 범위(km) 이내인 것만 포함합니다.
     * COUNT 쿼리 없이 size+1 방식.
     */
    @Transactional(readOnly = true)
    public PageResponse<GroupResponse> getDeadlineGroups(int page, int size, CustomUser customUser) {
        User user = getUser(customUser.getUsername());
        List<GroupWithLiked> raw = new ArrayList<>(groupRepository.findDeadlineGroups(page, size, customUser.getId(), user.getLocation(), user.getExposureRangeKm()));
        boolean hasNext = PageResponse.trim(raw, size);
        List<GroupResponse> responses = raw.stream()
            .map(gw -> GroupResponse.from(gw.group(), imageUrlResolver.resolve(gw.group().getImageUrl()), gw.liked()))
            .toList();
        return PageResponse.ofSlice(responses, page, size, hasNext);
    }

    @Transactional(readOnly = true)
    public GroupDetailResponse getGroup(Long groupId) {
        Group group = findGroup(groupId);
        List<GroupJoinQuestion> joinQuestions = joinQuestionRepository.findByGroupIdOrderByDisplayOrder(groupId);
        return GroupDetailResponse.of(group, imageUrlResolver.resolve(group.getImageUrl()), joinQuestions);
    }

    @Transactional
    public GroupResponse updateGroupImage(Long groupId, MultipartFile file, CustomUser customUser) {
        Group group = findGroup(groupId);
        validateLeader(group, customUser.getUsername());

        ImageResponse imageResponse = imageService.uploadImage(file, ImageTargetType.GROUP, String.valueOf(groupId));
        group.updateImageUrl(imageResponse.fileUrl());

        return GroupResponse.from(group, imageUrlResolver.resolve(group.getImageUrl()));
    }

    @Transactional
    public GroupResponse updateGroup(Long groupId, GroupUpdateRequest request, CustomUser customUser) {
        Group group = findGroup(groupId);
        validateLeader(group, customUser.getUsername());

        GroupJoinType joinType = request.joinType() != null ? request.joinType() : group.getJoinType();
        group.update(
            request.name(),
            request.description(),
            request.category(),
            request.subCategories(),
            request.meetingType(),
            request.region(),
            request.maxMemberCount(),
            joinType
        );

        if (group.getMeetingType() == GroupMeetingType.OFFLINE && group.getRegion() != null) {
            geocodeAndSetLocation(group, group.getRegion());
        } else if (group.getMeetingType() == GroupMeetingType.ONLINE) {
            group.updateLocation(null);
        }

        return GroupResponse.from(group, imageUrlResolver.resolve(group.getImageUrl()));
    }

    @Transactional
    public void deleteGroup(Long groupId, CustomUser customUser) {
        Group group = findGroup(groupId);
        validateLeader(group, customUser.getUsername());

        // 소속 멤버 전체 배치 삭제 (개별 삭제 루프 제거)
        groupMemberRepository.deleteAllByGroupId(groupId);

        User user = getUser(customUser.getUsername());
        group.delete(user);
    }

    @Transactional(readOnly = true)
    public List<String> getJoinQuestions(Long groupId) {
        findGroup(groupId);
        return joinQuestionRepository.findByGroupIdOrderByDisplayOrder(groupId)
            .stream()
            .map(GroupJoinQuestion::getQuestion)
            .toList();
    }

    @Transactional
    public void updateJoinQuestions(Long groupId, GroupJoinQuestionsUpdateRequest request, CustomUser customUser) {
        Group group = findGroup(groupId);
        validateLeader(group, customUser.getUsername());

        joinQuestionRepository.deleteByGroupId(groupId);

        List<GroupJoinQuestion> newQuestions = new java.util.ArrayList<>();
        List<String> questions = request.questions();
        for (int i = 0; i < questions.size(); i++) {
            newQuestions.add(GroupJoinQuestion.of(group, questions.get(i), i));
        }
        joinQuestionRepository.saveAll(newQuestions);
    }

    @Transactional
    public void joinGroup(Long groupId, String answer, CustomUser customUser) {
        Group group = findGroup(groupId);

        if (groupMemberRepository.existsByGroupIdAndUsername(groupId, customUser.getUsername())) {
            throw new AppException(GroupErrorCode.GROUP_ALREADY_JOINED);
        }

        if (group.getJoinType() == GroupJoinType.APPROVAL_REQUIRED) {
            if (joinRequestRepository.existsByGroupIdAndUsernameAndStatus(
                    groupId, customUser.getUsername(), GroupJoinRequestStatus.PENDING)) {
                throw new AppException(GroupErrorCode.GROUP_JOIN_REQUEST_ALREADY_EXISTS);
            }
            // 거절된 신청이 있으면 재활성화(PENDING으로 변경)하여 중복 키 오류 방지
            User applicant = getUser(customUser.getUsername());
            joinRequestRepository.findByGroupIdAndUsernameAndStatus(
                    groupId, customUser.getUsername(), GroupJoinRequestStatus.REJECTED)
                .ifPresentOrElse(
                    existing -> {
                        existing.reactivate(answer);
                        joinRequestRepository.save(existing);
                    },
                    () -> joinRequestRepository.save(GroupJoinRequest.of(group, applicant, answer))
                );
            // 관리자(LEADER/SUB_LEADER)에게 가입 신청 알림 발송
            List<GroupMember> managers = groupMemberRepository.findManagersByGroupId(groupId);
            for (GroupMember manager : managers) {
                notificationService.notify(
                    manager.getUser(),
                    NotificationType.MEETING_JOIN_REQUESTED,
                    applicant,
                    group.getId(),
                    group.getName()
                );
            }
            return;
        }

        if (group.isFull()) {
            throw new AppException(GroupErrorCode.GROUP_FULL);
        }

        User user = getUser(customUser.getUsername());
        GroupMember member = GroupMember.of(group, user, GroupMemberRole.MEMBER);
        groupMemberRepository.save(member);

        groupRepository.incrementMemberCount(groupId);

        // 모임장에게 신규 가입 알림. 모임장이 자기 모임에 다시 가입하는 케이스는 정상 흐름상 발생하지 않지만
        // 방어적으로 본인 제외 처리한다.
        User leader = group.getLeader();
        if (!leader.getId().equals(user.getId())) {
            notificationService.notify(
                leader,
                NotificationType.MEETING_MEMBER_JOINED,
                user,
                group.getId(),
                group.getName()
            );
        }
    }

    @Transactional(readOnly = true)
    public List<GroupJoinRequestResponse> getPendingJoinRequests(Long groupId, CustomUser customUser) {
        findGroup(groupId);
        GroupMember requester = groupMemberRepository.findByGroupIdAndUsername(groupId, customUser.getUsername())
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_MEMBER));
        if (!requester.isManager()) {
            throw new AppException(GroupErrorCode.GROUP_PERMISSION_DENIED);
        }

        return joinRequestRepository.findByGroupIdAndStatus(groupId, GroupJoinRequestStatus.PENDING)
            .stream()
            .map(GroupJoinRequestResponse::from)
            .toList();
    }

    @Transactional
    public void approveJoinRequest(Long groupId, Long requestId, CustomUser customUser) {
        Group group = findGroup(groupId);
        GroupMember requester = groupMemberRepository.findByGroupIdAndUsername(groupId, customUser.getUsername())
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_MEMBER));
        if (!requester.isManager()) {
            throw new AppException(GroupErrorCode.GROUP_PERMISSION_DENIED);
        }

        GroupJoinRequest joinRequest = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_JOIN_REQUEST_NOT_FOUND));

        if (group.isFull()) {
            throw new AppException(GroupErrorCode.GROUP_FULL);
        }

        joinRequest.approve();

        GroupMember member = GroupMember.of(group, joinRequest.getUser(), GroupMemberRole.MEMBER);
        groupMemberRepository.save(member);
        groupRepository.incrementMemberCount(groupId);
    }

    @Transactional
    public void rejectJoinRequest(Long groupId, Long requestId, CustomUser customUser) {
        findGroup(groupId);
        GroupMember requester = groupMemberRepository.findByGroupIdAndUsername(groupId, customUser.getUsername())
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_MEMBER));
        if (!requester.isManager()) {
            throw new AppException(GroupErrorCode.GROUP_PERMISSION_DENIED);
        }

        GroupJoinRequest joinRequest = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_JOIN_REQUEST_NOT_FOUND));

        joinRequest.reject();
    }

    @Transactional
    public void leaveGroup(Long groupId, CustomUser customUser) {
        GroupMember member = groupMemberRepository
            .findByGroupIdAndUsername(groupId, customUser.getUsername())
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_MEMBER));

        if (member.isLeader()) {
            throw new AppException(GroupErrorCode.GROUP_LEADER_CANNOT_LEAVE);
        }

        findGroup(groupId);
        groupMemberRepository.delete(member);
        groupRepository.decrementMemberCount(groupId);
    }

    @Transactional
    public void kickMember(Long groupId, String targetUsername, CustomUser customUser) {
        findGroup(groupId);
        GroupMember requester = groupMemberRepository.findByGroupIdAndUsername(groupId, customUser.getUsername())
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_MEMBER));
        if (!requester.isManager()) {
            throw new AppException(GroupErrorCode.GROUP_PERMISSION_DENIED);
        }

        GroupMember targetMember = groupMemberRepository
            .findByGroupIdAndUsername(groupId, targetUsername)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_MEMBER_NOT_FOUND));

        // SUB_LEADER 이상(LEADER/SUB_LEADER) 강퇴는 LEADER만 가능
        if (targetMember.isManager() && !requester.isLeader()) {
            throw new AppException(GroupErrorCode.GROUP_PERMISSION_DENIED);
        }

        groupMemberRepository.delete(targetMember);
        groupRepository.decrementMemberCount(groupId);
    }

    @Transactional
    public void updateMemberRole(Long groupId, String targetUsername, String newRole, CustomUser customUser) {
        findGroup(groupId);
        GroupMember requester = groupMemberRepository.findByGroupIdAndUsername(groupId, customUser.getUsername())
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_MEMBER));
        if (!requester.isLeader()) {
            throw new AppException(GroupErrorCode.GROUP_PERMISSION_DENIED);
        }
        GroupMember target = groupMemberRepository.findByGroupIdAndUsername(groupId, targetUsername)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_MEMBER_NOT_FOUND));
        if (target.isLeader()) {
            throw new AppException(GroupErrorCode.GROUP_PERMISSION_DENIED);
        }
        if ("SUB_LEADER".equals(newRole)) {
            target.promoteToSubLeader();
        } else if ("MEMBER".equals(newRole)) {
            target.demoteToMember();
        } else {
            throw new AppException(GroupErrorCode.GROUP_PERMISSION_DENIED);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<GroupMemberResponse> getMembers(Long groupId, int page, int size) {
        findGroup(groupId);
        Page<GroupMember> result =
            groupMemberRepository.findByGroupId(groupId, PageRequest.of(page, size));
        return PageResponse.from(result.map(GroupMemberResponse::from));
    }

    @Transactional(readOnly = true)
    public boolean hasMyPendingJoinRequest(Long groupId, CustomUser customUser) {
        findGroup(groupId);
        return joinRequestRepository.existsByGroupIdAndUsernameAndStatus(
            groupId, customUser.getUsername(), GroupJoinRequestStatus.PENDING);
    }

    @Transactional
    public void cancelMyJoinRequest(Long groupId, CustomUser customUser) {
        findGroup(groupId);
        GroupJoinRequest request = joinRequestRepository
            .findByGroupIdAndUsernameAndStatus(groupId, customUser.getUsername(), GroupJoinRequestStatus.PENDING)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_JOIN_REQUEST_NOT_FOUND));
        joinRequestRepository.delete(request);
    }

    /**
     * 이번 주(월요일 00:00 ~ 다음 주 월요일 00:00)에 일정이 있는 모임 목록을 조회합니다.
     * N+1 없이 schedule group_id IN 쿼리 → group IN 쿼리 두 번으로 처리합니다.
     */
    @Transactional(readOnly = true)
    public List<GroupResponse> getGroupsWithThisWeekSchedule(UUID userId) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        LocalDateTime weekStart = today.with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime weekEnd = weekStart.plusWeeks(1);

        List<Long> groupIds = scheduleRepository.findDistinctGroupIdsByStartAtBetween(weekStart, weekEnd);
        if (groupIds.isEmpty()) {
            return List.of();
        }

        List<GroupWithLiked> raw = groupRepository.findAllByIds(groupIds, userId);
        return raw.stream()
            .map(gw -> GroupResponse.from(gw.group(), imageUrlResolver.resolve(gw.group().getImageUrl()), gw.liked()))
            .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<GroupResponse> getMyGroups(CustomUser customUser, int page, int size) {
        List<GroupWithLiked> raw = new ArrayList<>(groupRepository.findByMemberUsername(customUser.getUsername(), page, size, customUser.getId()));
        boolean hasNext = PageResponse.trim(raw, size);
        List<GroupResponse> responses = raw.stream()
            .map(gw -> GroupResponse.from(gw.group(), imageUrlResolver.resolve(gw.group().getImageUrl()), gw.liked()))
            .toList();
        return PageResponse.ofSlice(responses, page, size, hasNext);
    }

    private Group findGroup(Long groupId) {
        return groupRepository.findById(groupId)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_FOUND));
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));
    }

    private void validateLeader(Group group, String username) {
        if (!group.getLeader().getUsername().equals(username)) {
            throw new AppException(GroupErrorCode.GROUP_FORBIDDEN);
        }
    }

    private void geocodeAndSetLocation(Group group, String address) {
        try {
            GeocodingClient.GeoPoint geo = geocodingClient.convert(address);
            Point point = geometryFactory.createPoint(new Coordinate(geo.longitude(), geo.latitude()));
            point.setSRID(4326);
            group.updateLocation(point);
        } catch (Exception e) {
            log.warn("모임 위치 geocoding 실패 (groupId={}, address={}): {}", group.getId(), address, e.getMessage());
        }
    }
}
