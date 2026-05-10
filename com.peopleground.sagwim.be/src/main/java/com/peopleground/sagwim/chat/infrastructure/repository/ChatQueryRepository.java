package com.peopleground.sagwim.chat.infrastructure.repository;

import com.peopleground.sagwim.chat.domain.entity.ChatRoomType;
import com.peopleground.sagwim.chat.domain.entity.QChatMessage;
import com.peopleground.sagwim.chat.domain.entity.QChatRoom;
import com.peopleground.sagwim.chat.domain.entity.QChatRoomMember;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatMessageResponse;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatRoomSummaryResponse;
import com.peopleground.sagwim.user.domain.entity.QUser;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * 채팅 도메인 복합 QueryDSL 쿼리.
 *
 * N+1 차단 전략:
 * - findRoomSummaries: 방 N개 조회 후 상대방/마지막메시지/안읽은 수를 서브쿼리/조인으로 한번에 가져온다.
 * - findMessages: sender를 fetchJoin 없이 DTO projection으로 직접 조립해 추가 쿼리를 제거한다.
 */
@Repository
@RequiredArgsConstructor
public class ChatQueryRepository {

    private final JPAQueryFactory queryFactory;

    /**
     * 1:1 방 중복 여부 확인 — 두 사용자 모두 활성 멤버인 DIRECT 방을 조회.
     * 순서 무관하게 (A, B) / (B, A) 모두 같은 방을 반환한다.
     */
    public Optional<Long> findDirectRoomId(UUID userAId, UUID userBId) {
        QChatRoomMember ma = new QChatRoomMember("memberA");
        QChatRoomMember mb = new QChatRoomMember("memberB");
        QChatRoom room = QChatRoom.chatRoom;

        Long roomId = queryFactory
            .select(ma.room.id)
            .from(ma)
            .join(mb).on(
                mb.room.id.eq(ma.room.id),
                mb.user.id.eq(userBId),
                mb.deletedDate.isNull()
            )
            .join(room).on(room.id.eq(ma.room.id), room.type.eq(ChatRoomType.DIRECT))
            .where(
                ma.user.id.eq(userAId),
                ma.deletedDate.isNull()
            )
            .fetchFirst();

        return Optional.ofNullable(roomId);
    }

    /**
     * 채팅방 목록 — N+1 완전 차단.
     *
     * 단일 QueryDSL 쿼리로 다음을 모두 조립:
     * - 내 활성 채팅방 (cursor 기반 무한스크롤)
     * - 상대방 user 정보 (username, nickname, profileImageUrl)
     * - 마지막 메시지 (서브쿼리: MAX id)
     * - 안읽은 메시지 수 (서브쿼리: COUNT WHERE id > lastReadMessageId)
     */
    public List<ChatRoomSummaryResponse> findRoomSummaries(UUID userId, Long cursor, int size) {
        QChatRoomMember myMember = new QChatRoomMember("myMember");
        QChatRoomMember partnerMember = new QChatRoomMember("partnerMember");
        QUser partner = new QUser("partner");
        QChatMessage lastMsg = new QChatMessage("lastMsg");
        QChatMessage unreadMsg = new QChatMessage("unreadMsg");
        QChatMessage anyMsg = new QChatMessage("anyMsg");

        // 마지막 메시지 id 서브쿼리
        var lastMsgIdSubquery = JPAExpressions
            .select(anyMsg.id.max())
            .from(anyMsg)
            .where(anyMsg.room.id.eq(myMember.room.id));

        // 안읽은 메시지 수 서브쿼리
        var unreadCountSubquery = JPAExpressions
            .select(unreadMsg.count())
            .from(unreadMsg)
            .where(
                unreadMsg.room.id.eq(myMember.room.id),
                myMember.lastReadMessageId.isNull()
                    .or(unreadMsg.id.gt(myMember.lastReadMessageId))
            );

        var query = queryFactory
            .select(Projections.constructor(ChatRoomSummaryResponse.class,
                myMember.room.id,
                partner.username,
                partner.nickname,
                partner.profileImageUrl,
                lastMsg.content,
                lastMsg.createdDate,
                unreadCountSubquery
            ))
            .from(myMember)
            .join(partnerMember).on(
                partnerMember.room.id.eq(myMember.room.id),
                partnerMember.user.id.ne(userId),
                partnerMember.deletedDate.isNull()
            )
            .join(partnerMember.user, partner)
            .leftJoin(lastMsg).on(lastMsg.id.eq(lastMsgIdSubquery))
            .where(
                myMember.user.id.eq(userId),
                myMember.deletedDate.isNull()
            );

        if (cursor != null) {
            query = query.where(myMember.room.id.lt(cursor));
        }

        return query
            .orderBy(
                Expressions.numberTemplate(Long.class, "COALESCE({0}, 0)", lastMsg.id).desc(),
                myMember.room.id.desc()
            )
            .limit(size + 1L)
            .fetch();
    }

    /**
     * 메시지 페이징 — N+1 완전 차단.
     *
     * DTO projection으로 sender(username, nickname, profileImageUrl)를 join해 한번에 조립.
     * cursor(messageId) 미만의 메시지를 id DESC 로 조회한다.
     */
    public List<ChatMessageResponse> findMessages(Long roomId, Long cursor, int size) {
        QChatMessage message = QChatMessage.chatMessage;
        QUser sender = new QUser("sender");

        var query = queryFactory
            .select(Projections.constructor(ChatMessageResponse.class,
                message.id,
                message.room.id,
                sender.username,
                sender.nickname,
                sender.profileImageUrl,
                message.content,
                message.type,
                message.createdDate
            ))
            .from(message)
            .join(message.sender, sender)
            .where(message.room.id.eq(roomId));

        if (cursor != null) {
            query = query.where(message.id.lt(cursor));
        }

        return query
            .orderBy(message.id.desc())
            .limit(size + 1L)
            .fetch();
    }
}
