package com.peopleground.sagwim.search.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

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
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("SearchHistoryService 단위 테스트")
class SearchHistoryServiceTest {

    @Mock private SearchHistoryRepository searchHistoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private ContentRepository contentRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private ImageUrlResolver imageUrlResolver;

    @InjectMocks private SearchHistoryService searchHistoryService;

    private CustomUser customUser(UUID id) {
        return new CustomUser(id, "me", null, null, true);
    }

    @Test
    @DisplayName("저장 - 리포지토리에 (userId, type, targetId) 로 위임한다")
    void save_delegatesToRepository() {
        // given
        UUID meId = UUID.randomUUID();

        // when
        searchHistoryService.save(customUser(meId), SearchTargetType.POST, "51");

        // then
        verify(searchHistoryRepository).save(meId, SearchTargetType.POST, "51");
    }

    @Test
    @DisplayName("조회 - 유저/게시글/모임 라벨을 채워 최근 순서를 유지해 반환한다")
    void getRecent_fillsLabelsAndKeepsOrder() {
        // given
        UUID meId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        List<SearchHistoryRow> rows = List.of(
            new SearchHistoryRow(SearchTargetType.GROUP, "3", now),
            new SearchHistoryRow(SearchTargetType.POST, "51", now.minusMinutes(1)),
            new SearchHistoryRow(SearchTargetType.USER, "user2", now.minusMinutes(2))
        );
        given(searchHistoryRepository.findRecent(meId, 20)).willReturn(rows);

        User user = org.mockito.Mockito.mock(User.class);
        given(user.getUsername()).willReturn("user2");
        given(user.getNickname()).willReturn("유저이");
        given(user.getProfileImageUrl()).willReturn("/images/u.jpg");
        given(userRepository.findByUsernameIn(List.of("user2"))).willReturn(List.of(user));
        given(imageUrlResolver.resolve("/images/u.jpg")).willReturn("https://cdn/u.jpg");

        Content content = org.mockito.Mockito.mock(Content.class);
        given(content.getId()).willReturn(51L);
        given(content.getBody()).willReturn("게시글 본문");
        given(contentRepository.findAllByIds(List.of(51L))).willReturn(List.of(content));

        Group group = org.mockito.Mockito.mock(Group.class);
        given(group.getId()).willReturn(3L);
        given(group.getName()).willReturn("온라인 테스트");
        given(groupRepository.findAllByIds(List.of(3L), meId))
            .willReturn(List.of(new GroupWithLiked(group, true)));

        // when
        List<SearchHistoryResponse> result = searchHistoryService.getRecent(customUser(meId), 20);

        // then — DB 정렬 순서(GROUP, POST, USER) 유지
        assertThat(result).hasSize(3);
        assertThat(result.get(0).type()).isEqualTo("GROUP");
        assertThat(result.get(0).label()).isEqualTo("온라인 테스트");
        assertThat(result.get(1).type()).isEqualTo("POST");
        assertThat(result.get(1).label()).isEqualTo("게시글 본문");
        assertThat(result.get(2).type()).isEqualTo("USER");
        assertThat(result.get(2).label()).isEqualTo("유저이");
        assertThat(result.get(2).targetId()).isEqualTo("user2");
        assertThat(result.get(2).profileImageUrl()).isEqualTo("https://cdn/u.jpg");
    }

    @Test
    @DisplayName("조회 - 삭제 등으로 라벨을 찾지 못한 항목은 결과에서 제외한다")
    void getRecent_excludesItemsWithoutLabel() {
        // given
        UUID meId = UUID.randomUUID();
        List<SearchHistoryRow> rows = List.of(
            new SearchHistoryRow(SearchTargetType.POST, "51", LocalDateTime.now())
        );
        given(searchHistoryRepository.findRecent(meId, 20)).willReturn(rows);
        given(userRepository.findByUsernameIn(List.of())).willReturn(List.of());
        given(contentRepository.findAllByIds(List.of(51L))).willReturn(List.of()); // 삭제됨 → 라벨 없음
        given(groupRepository.findAllByIds(eq(List.of()), eq(meId))).willReturn(List.of());

        // when
        List<SearchHistoryResponse> result = searchHistoryService.getRecent(customUser(meId), 20);

        // then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("조회 - limit 이 0 이하면 기본값 20 으로 조회한다")
    void getRecent_nonPositiveLimit_usesDefault() {
        // given
        UUID meId = UUID.randomUUID();
        given(searchHistoryRepository.findRecent(meId, 20)).willReturn(List.of());
        given(userRepository.findByUsernameIn(List.of())).willReturn(List.of());
        given(contentRepository.findAllByIds(List.of())).willReturn(List.of());
        given(groupRepository.findAllByIds(eq(List.of()), eq(meId))).willReturn(List.of());

        // when
        searchHistoryService.getRecent(customUser(meId), 0);

        // then
        verify(searchHistoryRepository).findRecent(meId, 20);
    }
}
