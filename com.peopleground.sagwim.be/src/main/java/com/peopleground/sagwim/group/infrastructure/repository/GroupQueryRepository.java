package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.GroupWithLiked;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.GroupStatus;
import com.peopleground.sagwim.group.domain.entity.QGroup;
import com.peopleground.sagwim.group.domain.entity.QGroupMember;
import com.peopleground.sagwim.like.domain.entity.QGroupLike;
import com.peopleground.sagwim.user.domain.entity.QUser;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

// 빌드 후 Q클래스 자동 생성됨 (QGroup.group, QGroupMember.groupMember, QUser.user, QGroupLike.groupLike)
@Repository
@RequiredArgsConstructor
public class GroupQueryRepository {

    private final JPAQueryFactory queryFactory;

    public Optional<Group> findById(Long id) {
        QGroup group = QGroup.group;
        QUser leader = QUser.user;

        return Optional.ofNullable(
            queryFactory
                .selectFrom(group)
                .join(group.leader, leader).fetchJoin()
                .where(
                    group.id.eq(id),
                    group.deletedDate.isNull()
                )
                .fetchOne()
        );
    }

    public Page<GroupWithLiked> findAll(Pageable pageable, String keyword, GroupCategory category, UUID userId) {
        QGroup group = QGroup.group;
        QUser leader = QUser.user;
        QGroupLike groupLike = new QGroupLike("groupLikeForStatus");

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(group.deletedDate.isNull());
        builder.and(group.status.eq(GroupStatus.ACTIVE));

        if (keyword != null && !keyword.isBlank()) {
            builder.and(group.name.containsIgnoreCase(keyword));
        }
        if (category != null) {
            builder.and(group.category.eq(category));
        }

        List<Tuple> tuples = queryFactory
            .select(group, groupLike.id.isNotNull())
            .from(group)
            .join(group.leader, leader).fetchJoin()
            .leftJoin(groupLike).on(
                groupLike.group.eq(group),
                groupLike.user.id.eq(userId)
            )
            .where(builder)
            .orderBy(group.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(group.count())
            .from(group)
            .where(builder)
            .fetchOne();

        List<GroupWithLiked> result = tuples.stream()
            .map(t -> new GroupWithLiked(t.get(group), Boolean.TRUE.equals(t.get(groupLike.id.isNotNull()))))
            .toList();

        return new PageImpl<>(result, pageable, total != null ? total : 0);
    }

    /**
     * 생성된 지 7일 미만인 신규 모임을 최신순으로 조회합니다.
     * KST 기준으로 now - 7days 이후 생성된 모임만 포함합니다.
     */
    public Page<GroupWithLiked> findNewGroups(Pageable pageable, UUID userId) {
        QGroup group = QGroup.group;
        QUser leader = QUser.user;
        QGroupLike groupLike = new QGroupLike("groupLikeForStatus");

        LocalDateTime sevenDaysAgo = LocalDateTime.now(ZoneId.of("Asia/Seoul")).minusDays(7);

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(group.deletedDate.isNull());
        builder.and(group.status.eq(GroupStatus.ACTIVE));
        builder.and(group.createdDate.goe(sevenDaysAgo));

        List<Tuple> tuples = queryFactory
            .select(group, groupLike.id.isNotNull())
            .from(group)
            .join(group.leader, leader).fetchJoin()
            .leftJoin(groupLike).on(
                groupLike.group.eq(group),
                groupLike.user.id.eq(userId)
            )
            .where(builder)
            .orderBy(group.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(group.count())
            .from(group)
            .where(builder)
            .fetchOne();

        List<GroupWithLiked> result = tuples.stream()
            .map(t -> new GroupWithLiked(t.get(group), Boolean.TRUE.equals(t.get(groupLike.id.isNotNull()))))
            .toList();

        return new PageImpl<>(result, pageable, total != null ? total : 0);
    }

    /**
     * 좋아요 수 내림차순으로 모임 목록을 조회합니다 (인기 모임).
     */
    public Page<GroupWithLiked> findPopularGroups(Pageable pageable, UUID userId) {
        QGroup group = QGroup.group;
        QUser leader = QUser.user;
        QGroupLike groupLike = new QGroupLike("groupLikeForStatus");

        List<Tuple> tuples = queryFactory
            .select(group, groupLike.id.isNotNull())
            .from(group)
            .join(group.leader, leader).fetchJoin()
            .leftJoin(groupLike).on(
                groupLike.group.eq(group),
                groupLike.user.id.eq(userId)
            )
            .where(group.deletedDate.isNull(), group.status.eq(GroupStatus.ACTIVE), group.likeCount.goe(1))
            .orderBy(group.likeCount.desc(), group.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(group.count())
            .from(group)
            .where(group.deletedDate.isNull(), group.status.eq(GroupStatus.ACTIVE), group.likeCount.goe(1))
            .fetchOne();

        List<GroupWithLiked> result = tuples.stream()
            .map(t -> new GroupWithLiked(t.get(group), Boolean.TRUE.equals(t.get(groupLike.id.isNotNull()))))
            .toList();

        return new PageImpl<>(result, pageable, total != null ? total : 0);
    }

    public Page<GroupWithLiked> findByMemberUsername(String username, Pageable pageable, UUID userId) {
        QGroup group = QGroup.group;
        QGroupMember groupMember = QGroupMember.groupMember;
        QUser user = new QUser("memberUser");
        QUser leader = new QUser("leader");
        QGroupLike groupLike = new QGroupLike("groupLikeForStatus");

        List<Tuple> tuples = queryFactory
            .select(group, groupLike.id.isNotNull())
            .from(group)
            .join(group.leader, leader).fetchJoin()
            .join(groupMember).on(groupMember.group.eq(group))
            .join(groupMember.user, user)
            .leftJoin(groupLike).on(
                groupLike.group.eq(group),
                groupLike.user.id.eq(userId)
            )
            .where(
                user.username.eq(username),
                group.deletedDate.isNull(),
                groupMember.deletedDate.isNull()
            )
            .orderBy(group.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(group.count())
            .from(group)
            .join(groupMember).on(groupMember.group.eq(group))
            .join(groupMember.user, user)
            .where(
                user.username.eq(username),
                group.deletedDate.isNull(),
                groupMember.deletedDate.isNull()
            )
            .fetchOne();

        List<GroupWithLiked> result = tuples.stream()
            .map(t -> new GroupWithLiked(t.get(group), Boolean.TRUE.equals(t.get(groupLike.id.isNotNull()))))
            .toList();

        return new PageImpl<>(result, pageable, total != null ? total : 0);
    }

    /**
     * 관리자용: 소프트 삭제된 모임 제외, 상태 무관 전체 조회 (id DESC 정렬)
     */
    public Page<Group> findAllForAdmin(Pageable pageable) {
        QGroup group = QGroup.group;
        QUser leader = new QUser("leader");

        List<Group> groups = queryFactory
            .selectFrom(group)
            .join(group.leader, leader).fetchJoin()
            .where(group.deletedDate.isNull())
            .orderBy(group.id.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(group.count())
            .from(group)
            .where(group.deletedDate.isNull())
            .fetchOne();

        return new PageImpl<>(groups, pageable, total != null ? total : 0);
    }

    public Map<String, Long> countMonthlyCreations(LocalDateTime windowStart) {

        QGroup group = QGroup.group;

        StringExpression monthExpr = Expressions.stringTemplate(
            "function('to_char_kst_month', {0})", group.createdDate);

        var countExpr = group.count();

        List<Tuple> results = queryFactory
            .select(monthExpr, countExpr)
            .from(group)
            .where(
                group.deletedDate.isNull(),
                group.createdDate.goe(windowStart)
            )
            .groupBy(monthExpr)
            .orderBy(monthExpr.asc())
            .fetch();

        return results.stream()
            .collect(Collectors.toMap(
                t -> t.get(monthExpr),
                t -> t.get(countExpr),
                (a, b) -> a,
                LinkedHashMap::new
            ));
    }
}
