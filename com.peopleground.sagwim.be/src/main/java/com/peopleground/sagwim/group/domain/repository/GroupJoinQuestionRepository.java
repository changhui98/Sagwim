package com.peopleground.sagwim.group.domain.repository;

import com.peopleground.sagwim.group.domain.entity.GroupJoinQuestion;
import java.util.List;

public interface GroupJoinQuestionRepository {

    List<GroupJoinQuestion> findByGroupIdOrderByDisplayOrder(Long groupId);

    void deleteByGroupId(Long groupId);

    GroupJoinQuestion save(GroupJoinQuestion question);

    List<GroupJoinQuestion> saveAll(List<GroupJoinQuestion> questions);
}
