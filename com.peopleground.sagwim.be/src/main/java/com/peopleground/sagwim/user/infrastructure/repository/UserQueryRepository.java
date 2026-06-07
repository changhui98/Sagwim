package com.peopleground.sagwim.user.infrastructure.repository;

import com.peopleground.sagwim.user.domain.entity.QUser;
import com.peopleground.sagwim.user.domain.entity.User;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UserQueryRepository {

    private final JPAQueryFactory queryFactory;

    public Page<User> findAllUsers(Pageable pageable) {

        QUser user = QUser.user;

        List<User> content = queryFactory
            .selectFrom(user)
            .where(user.deletedDate.isNull())
            .orderBy(user.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(user.count())
            .from(user)
            .where(user.deletedDate.isNull())
            .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0);
    }

    public Page<User> findAllUsersForAdmin(String keyword, String searchField, Pageable pageable) {

        QUser user = QUser.user;

        // 관리자 검색: searchField에 따라 닉네임/이메일/아이디 개별 또는 통합(ALL) OR 부분일치 (대소문자 무시)
        BooleanBuilder condition = new BooleanBuilder();
        if (keyword != null && !keyword.isBlank()) {
            condition.and(buildUserSearchCondition(user, keyword, searchField));
        }

        List<User> content = queryFactory
            .selectFrom(user)
            .where(condition)
            .orderBy(user.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(user.count())
            .from(user)
            .where(condition)
            .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0);
    }

    // searchField: NICKNAME / EMAIL / USERNAME 개별, 그 외(ALL 등)는 통합 OR
    private BooleanExpression buildUserSearchCondition(QUser user, String keyword, String searchField) {
        return switch (searchField == null ? "ALL" : searchField) {
            case "NICKNAME" -> user.nickname.containsIgnoreCase(keyword);
            case "EMAIL" -> user.userEmail.containsIgnoreCase(keyword);
            case "USERNAME" -> user.username.containsIgnoreCase(keyword);
            default -> user.nickname.containsIgnoreCase(keyword)
                .or(user.userEmail.containsIgnoreCase(keyword))
                .or(user.username.containsIgnoreCase(keyword));
        };
    }

    public Page<User> searchByKeyword(String keyword, Pageable pageable) {

        QUser user = QUser.user;

        BooleanBuilder condition = new BooleanBuilder();
        condition.and(user.deletedDate.isNull());
        condition.and(user.isSearchable.isTrue());
        if (keyword != null && !keyword.isBlank()) {
            condition.and(user.nickname.containsIgnoreCase(keyword));
        }

        List<User> content = queryFactory
            .selectFrom(user)
            .where(condition)
            .orderBy(user.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(user.count())
            .from(user)
            .where(condition)
            .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0);
    }

    public Map<String, Long> countMonthlySignups(LocalDateTime windowStart) {

        QUser user = QUser.user;

        // 모든 도메인 시각이 KST 로 저장되므로(별도 타임존 변환 불필요),
        // YYYY-MM 포맷팅만 수행하는 커스텀 HQL 함수(to_char_kst_month)를 사용한다.
        // 함수 등록: global.persistence.PostgresKstFunctionContributor
        StringExpression monthExpr = Expressions.stringTemplate(
            "function('to_char_kst_month', {0})", user.createdDate);

        var countExpr = user.count();

        List<Tuple> results = queryFactory
            .select(monthExpr, countExpr)
            .from(user)
            .where(
                user.deletedDate.isNull(),
                user.createdDate.goe(windowStart)
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

    /**
     * 주어진 username 목록에 대한 {username -> nickname} 매핑을 배치로 조회한다.
     * 게시글 목록 등 다건 응답에서 작성자 닉네임을 N+1 없이 채우기 위한 전용 경로.
     */
    public Map<String, String> findNicknamesByUsernames(Collection<String> usernames) {

        if (usernames == null || usernames.isEmpty()) {
            return Collections.emptyMap();
        }

        QUser user = QUser.user;

        List<Tuple> tuples = queryFactory
            .select(user.username, user.nickname)
            .from(user)
            .where(user.username.in(usernames))
            .fetch();

        return tuples.stream()
            .collect(Collectors.toMap(
                t -> t.get(user.username),
                t -> t.get(user.nickname),
                (a, b) -> a
            ));
    }
}
