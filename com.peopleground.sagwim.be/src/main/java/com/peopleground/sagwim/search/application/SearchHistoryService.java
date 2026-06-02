package com.peopleground.sagwim.search.application;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.group.domain.GroupWithLiked;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.image.application.ImageUrlResolver;
import com.peopleground.sagwim.search.domain.SearchHistoryRow;
import com.peopleground.sagwim.search.domain.entity.SearchTargetType;
import com.peopleground.sagwim.search.domain.repository.SearchHistoryRepository;
import com.peopleground.sagwim.search.presentation.dto.response.SearchHistoryResponse;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SearchHistoryService {

    private static final int DEFAULT_LIMIT = 20;

    private final SearchHistoryRepository searchHistoryRepository;
    private final UserRepository userRepository;
    private final ContentRepository contentRepository;
    private final GroupRepository groupRepository;
    private final ImageUrlResolver imageUrlResolver;

    /**
     * 검색 결과에서 상세로 진입한 항목을 기록한다(중복 시 최근 본 시각만 갱신).
     */
    @Transactional
    public void save(CustomUser customUser, SearchTargetType type, String targetId) {
        searchHistoryRepository.save(customUser.getId(), type, targetId);
    }

    /**
     * 최근 본 순으로 검색 기록을 반환한다. 라벨(닉네임/본문/모임명)은 type 별 배치 조회로 채우고,
     * 삭제 등으로 라벨을 찾지 못한 항목은 결과에서 제외한다.
     */
    @Transactional(readOnly = true)
    public List<SearchHistoryResponse> getRecent(CustomUser customUser, int limit) {
        int size = limit > 0 ? limit : DEFAULT_LIMIT;
        List<SearchHistoryRow> rows = searchHistoryRepository.findRecent(customUser.getId(), size);

        List<String> usernames = rows.stream()
            .filter(r -> r.type() == SearchTargetType.USER)
            .map(SearchHistoryRow::targetId)
            .toList();
        List<Long> postIds = rows.stream()
            .filter(r -> r.type() == SearchTargetType.POST)
            .map(r -> Long.parseLong(r.targetId()))
            .toList();
        List<Long> groupIds = rows.stream()
            .filter(r -> r.type() == SearchTargetType.GROUP)
            .map(r -> Long.parseLong(r.targetId()))
            .toList();

        Map<String, User> userMap = userRepository.findByUsernameIn(usernames).stream()
            .collect(Collectors.toMap(User::getUsername, Function.identity(), (a, b) -> a));
        Map<Long, String> postLabels = contentRepository.findAllByIds(postIds).stream()
            .collect(Collectors.toMap(Content::getId, Content::getBody, (a, b) -> a));
        Map<Long, String> groupLabels = groupRepository.findAllByIds(groupIds, customUser.getId()).stream()
            .map(GroupWithLiked::group)
            .collect(Collectors.toMap(Group::getId, Group::getName, (a, b) -> a));

        return rows.stream()
            .map(r -> toResponse(r, userMap, postLabels, groupLabels))
            .filter(Objects::nonNull)
            .toList();
    }

    private SearchHistoryResponse toResponse(
        SearchHistoryRow row,
        Map<String, User> userMap,
        Map<Long, String> postLabels,
        Map<Long, String> groupLabels
    ) {
        switch (row.type()) {
            case USER -> {
                User user = userMap.get(row.targetId());
                if (user == null) {
                    return null;
                }
                return new SearchHistoryResponse(
                    "USER", row.targetId(), user.getNickname(),
                    imageUrlResolver.resolve(user.getProfileImageUrl()));
            }
            case POST -> {
                String body = postLabels.get(Long.parseLong(row.targetId()));
                return body == null ? null
                    : new SearchHistoryResponse("POST", row.targetId(), body, null);
            }
            case GROUP -> {
                String name = groupLabels.get(Long.parseLong(row.targetId()));
                return name == null ? null
                    : new SearchHistoryResponse("GROUP", row.targetId(), name, null);
            }
            default -> {
                return null;
            }
        }
    }
}
