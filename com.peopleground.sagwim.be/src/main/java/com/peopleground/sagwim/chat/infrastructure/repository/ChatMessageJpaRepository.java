package com.peopleground.sagwim.chat.infrastructure.repository;

import com.peopleground.sagwim.chat.domain.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageJpaRepository extends JpaRepository<ChatMessage, Long> {}
