package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.entity.GroupJoinQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GroupJoinQuestionJpaRepository extends JpaRepository<GroupJoinQuestion, Long> {

    List<GroupJoinQuestion> findByGroupIdOrderByDisplayOrder(Long groupId);

    @Modifying
    @Query("DELETE FROM p_group_join_question q WHERE q.group.id = :groupId")
    void deleteByGroupId(@Param("groupId") Long groupId);
}
