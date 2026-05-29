package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.GroupWithLiked;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.GroupMeetingType;
import com.peopleground.sagwim.group.domain.entity.GroupStatus;
import com.peopleground.sagwim.group.domain.entity.QGroup;
import com.peopleground.sagwim.group.domain.entity.QGroupMember;
import com.peopleground.sagwim.like.domain.entity.QGroupLike;
import com.peopleground.sagwim.user.domain.entity.QUser;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.BooleanExpression;
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
import org.locationtech.jts.geom.Point;
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

    /**
     * 무한스크롤용 모임 목록 조회. COUNT 쿼리 없이 size+1 방식.
     */
    public List<GroupWithLiked> findAll(int page, int size, String keyword, GroupCategory category, UUID userId) {
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
            .offset((long) page * size)
            .limit(size + 1L)
            .fetch();

        return tuples.stream()
            .map(t -> new GroupWithLiked(t.get(group), Boolean.TRUE.equals(t.get(groupLike.id.isNotNull()))))
            .toList();
    }

    /**
     * 무한스크롤용 신규 모임 조회. COUNT 쿼리 없이 size+1 방식.
     * OFFLINE 모임은 사용자의 노출 범위(km) 이내인 것만 포함합니다.
     */
    public List<GroupWithLiked> findNewGroups(int page, int size, UUID userId, Point userLocation, int exposureRangeKm) {
        QGroup group = QGroup.group;
        QUser leader = QUser.user;
        QGroupLike groupLike = new QGroupLike("groupLikeForStatus");

        LocalDateTime sevenDaysAgo = LocalDateTime.now(ZoneId.of("Asia/Seoul")).minusDays(7);

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(group.deletedDate.isNull());
        builder.and(group.status.eq(GroupStatus.ACTIVE));
        builder.and(group.createdDate.goe(sevenDaysAgo));
        builder.and(locationFilter(group, userLocation, exposureRangeKm));

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
            .offset((long) page * size)
            .limit(size + 1L)
            .fetch();

        return tuples.stream()
            .map(t -> new GroupWithLiked(t.get(group), Boolean.TRUE.equals(t.get(groupLike.id.isNotNull()))))
            .toList();
    }

    /**
     * 무한스크롤용 인기 모임 조회. COUNT 쿼리 없이 size+1 방식.
     * OFFLINE 모임은 사용자의 노출 범위(km) 이내인 것만 포함합니다.
     */
    public List<GroupWithLiked> findPopularGroups(int page, int size, UUID userId, Point userLocation, int exposureRangeKm) {
        QGroup group = QGroup.group;
        QUser leader = QUser.user;
        QGroupLike groupLike = new QGroupLike("groupLikeForStatus");

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(group.deletedDate.isNull());
        builder.and(group.status.eq(GroupStatus.ACTIVE));
        builder.and(group.likeCount.goe(1));
        builder.and(locationFilter(group, userLocation, exposureRangeKm));

        List<Tuple> tuples = queryFactory
            .select(group, groupLike.id.isNotNull())
            .from(group)
            .join(group.leader, leader).fetchJoin()
            .leftJoin(groupLike).on(
                groupLike.group.eq(group),
                groupLike.user.id.eq(userId)
            )
            .where(builder)
            .orderBy(group.likeCount.desc(), group.createdDate.desc())
            .offset((long) page * size)
            .limit(size + 1L)
            .fetch();

        return tuples.stream()
            .map(t -> new GroupWithLiked(t.get(group), Boolean.TRUE.equals(t.get(groupLike.id.isNotNull()))))
            .toList();
    }

    /**
     * 무한스크롤용 내 모임 목록 조회. COUNT 쿼리 없이 size+1 방식.
     */
    public List<GroupWithLiked> findByMemberUsername(String username, int page, int size, UUID userId) {
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
            .offset((long) page * size)
            .limit(size + 1L)
            .fetch();

        return tuples.stream()
            .map(t -> new GroupWithLiked(t.get(group), Boolean.TRUE.equals(t.get(groupLike.id.isNotNull()))))
            .toList();
    }

    /**
     * ONLINE 모임은 항상 통과, OFFLINE 모임은 userLocation 기준 exposureRangeKm 이내인 것만 통과.
     * location 이 null 인 OFFLINE 모임(지오코딩 실패)은 제외됩니다.
     * userLocation 이 null 이면 필터를 적용하지 않습니다.
     */
    private BooleanExpression locationFilter(QGroup group, Point userLocation, int exposureRangeKm) {
        if (userLocation == null) {
            return null;
        }
        double rangeMeters = exposureRangeKm * 1000.0;
        BooleanExpression isOnline = group.meetingType.eq(GroupMeetingType.ONLINE);
        BooleanExpression withinRange = Expressions.booleanTemplate(
            "st_dwithin({0}, {1}, {2})",
            group.location, userLocation, rangeMeters
        );
        return isOnline.or(withinRange);
    }

    /**
     * 관리자용: 소프트 삭제된 모임 제외, 상태 무관 전체 조회 (id DESC 정렬)
     * COUNT 쿼리 유지 — 어드민 페이지 번호 UI 필요.
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

    /**
     * id 목록으로 모임 일괄 조회. N+1 없이 IN 쿼리 한 번으로 처리.
     * userId가 null이면 isLiked=false 로 반환합니다.
     */
    public List<GroupWithLiked> findAllByIds(List<Long> ids, UUID userId) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        QGroup group = QGroup.group;
        QUser leader = new QUser("leader");
        QGroupLike groupLike = new QGroupLike("groupLikeForStatus");

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(group.id.in(ids));
        builder.and(group.deletedDate.isNull());
        builder.and(group.status.eq(GroupStatus.ACTIVE));

        BooleanExpression likedExpr = groupLike.id.isNotNull();

        var query = queryFactory
            .select(group, likedExpr)
            .from(group)
            .join(group.leader, leader).fetchJoin();

        if (userId != null) {
            query = query.leftJoin(groupLike).on(
                groupLike.group.eq(group),
                groupLike.user.id.eq(userId)
            );
        }

        List<Tuple> tuples = query
            .where(builder)
            .orderBy(group.id.asc())
            .fetch();

        return tuples.stream()
            .map(t -> new GroupWithLiked(t.get(group), Boolean.TRUE.equals(t.get(likedExpr))))
            .toList();
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
