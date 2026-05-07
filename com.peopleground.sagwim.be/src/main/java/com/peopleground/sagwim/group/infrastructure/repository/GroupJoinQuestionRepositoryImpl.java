package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.entity.GroupJoinQuestion;
import com.peopleground.sagwim.group.domain.repository.GroupJoinQuestionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class GroupJoinQuestionRepositoryImpl implements GroupJoinQuestionRepository {

    private final GroupJoinQuestionJpaRepository jpaRepository;

    @Override
    public List<GroupJoinQuestion> findByGroupIdOrderByDisplayOrder(Long groupId) {
        return jpaRepository.findByGroupIdOrderByDisplayOrder(groupId);
    }

    @Override
    public void deleteByGroupId(Long groupId) {
        jpaRepository.deleteByGroupId(groupId);
    }

    @Override
    public GroupJoinQuestion save(GroupJoinQuestion question) {
        return jpaRepository.save(question);
    }

    @Override
    public List<GroupJoinQuestion> saveAll(List<GroupJoinQuestion> questions) {
        return jpaRepository.saveAll(questions);
    }
}
