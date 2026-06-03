package com.peopleground.sagwim.user.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.comment.domain.repository.CommentRepository;
import com.peopleground.sagwim.content.application.assembler.ContentResponseAssembler;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.group.domain.GroupWithLiked;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.image.application.ImageUrlResolver;
import com.peopleground.sagwim.like.domain.LikedActivityRow;
import com.peopleground.sagwim.like.domain.repository.ContentLikeRepository;
import com.peopleground.sagwim.like.domain.repository.GroupLikeRepository;
import com.peopleground.sagwim.like.domain.repository.LikedActivityRepository;
import com.peopleground.sagwim.user.presentation.dto.response.LikedActivityResponse;
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
@DisplayName("UserActivityService 단위 테스트 (통합 좋아요 활동)")
class UserActivityServiceTest {

    @Mock private ContentLikeRepository contentLikeRepository;
    @Mock private GroupLikeRepository groupLikeRepository;
    @Mock private LikedActivityRepository likedActivityRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private ContentRepository contentRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private ContentResponseAssembler contentResponseAssembler;
    @Mock private ImageUrlResolver imageUrlResolver;

    @InjectMocks private UserActivityService userActivityService;

    private CustomUser customUser(UUID id) {
        return new CustomUser(id, "me", null, null, true);
    }

    @Test
    @DisplayName("통합 좋아요 활동 - 게시글/모임 라벨을 채워 정렬 순서를 유지해 반환한다")
    void getLikedActivities_fillsLabelsAndKeepsOrder() {
        // given
        UUID meId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        List<LikedActivityRow> rows = List.of(
            new LikedActivityRow("GROUP", 3L, now),
            new LikedActivityRow("POST", 51L, now.minusMinutes(1))
        );
        given(likedActivityRepository.findLikedActivities(meId, 0, 10)).willReturn(rows);

        Content content = org.mockito.Mockito.mock(Content.class);
        given(content.getId()).willReturn(51L);
        given(content.getBody()).willReturn("게시글 본문");
        given(contentRepository.findAllByIds(List.of(51L))).willReturn(List.of(content));

        Group group = org.mockito.Mockito.mock(Group.class);
        given(group.getId()).willReturn(3L);
        given(group.getName()).willReturn("모임 이름");
        given(groupRepository.findAllByIds(List.of(3L), meId))
            .willReturn(List.of(new GroupWithLiked(group, true)));

        // when
        PageResponse<LikedActivityResponse> response =
            userActivityService.getLikedActivities(customUser(meId), 0, 10);

        // then — DB 정렬 순서(GROUP, POST) 유지, hasNext=false
        assertThat(response.content()).hasSize(2);
        assertThat(response.content().get(0).type()).isEqualTo("GROUP");
        assertThat(response.content().get(0).label()).isEqualTo("모임 이름");
        assertThat(response.content().get(1).type()).isEqualTo("POST");
        assertThat(response.content().get(1).label()).isEqualTo("게시글 본문");
        assertThat(response.hasNext()).isFalse();
    }

    @Test
    @DisplayName("통합 좋아요 활동 - size+1 건이 조회되면 초과분을 잘라내고 hasNext 를 true 로 한다")
    void getLikedActivities_trimAndHasNext() {
        // given — size=1 인데 2건 조회 → 1건만 남고 hasNext=true
        UUID meId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        List<LikedActivityRow> rows = List.of(
            new LikedActivityRow("POST", 51L, now),
            new LikedActivityRow("POST", 52L, now.minusMinutes(1))
        );
        given(likedActivityRepository.findLikedActivities(meId, 0, 1)).willReturn(rows);

        Content c1 = org.mockito.Mockito.mock(Content.class);
        given(c1.getId()).willReturn(51L);
        given(c1.getBody()).willReturn("첫 번째");
        // trim 후 남는 id 는 51L 하나뿐
        given(contentRepository.findAllByIds(List.of(51L))).willReturn(List.of(c1));
        given(groupRepository.findAllByIds(List.of(), meId)).willReturn(List.of());

        // when
        PageResponse<LikedActivityResponse> response =
            userActivityService.getLikedActivities(customUser(meId), 0, 1);

        // then
        assertThat(response.content()).hasSize(1);
        assertThat(response.content().get(0).targetId()).isEqualTo(51L);
        assertThat(response.hasNext()).isTrue();
    }

    @Test
    @DisplayName("통합 좋아요 활동 - 삭제 등으로 라벨을 찾지 못한 항목은 제외한다")
    void getLikedActivities_excludesMissingLabel() {
        // given
        UUID meId = UUID.randomUUID();
        List<LikedActivityRow> rows = List.of(
            new LikedActivityRow("POST", 51L, LocalDateTime.now())
        );
        given(likedActivityRepository.findLikedActivities(meId, 0, 10)).willReturn(rows);
        given(contentRepository.findAllByIds(List.of(51L))).willReturn(List.of()); // 삭제됨
        given(groupRepository.findAllByIds(List.of(), meId)).willReturn(List.of());

        // when
        PageResponse<LikedActivityResponse> response =
            userActivityService.getLikedActivities(customUser(meId), 0, 10);

        // then
        assertThat(response.content()).isEmpty();
    }
}
