package com.peopleground.sagwim.chat.infrastructure.repository;

import com.peopleground.sagwim.chat.domain.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRoomJpaRepository extends JpaRepository<ChatRoom, Long> {}
