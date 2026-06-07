package com.peopleground.sagwim.content.infrastructure.repository;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.entity.QContent;
import com.peopleground.sagwim.content.presentation.dto.request.SearchType;
import com.peopleground.sagwim.tag.domain.entity.QContentTag;
import com.peopleground.sagwim.tag.domain.entity.QTag;
import com.peopleground.sagwim.user.domain.entity.QUser;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ContentQueryRepository {

    private final JPAQueryFactory queryFactory;

    public Optional<Content> findById(Long id) {

        QContent content = QContent.content;

        return Optional.ofNullable(
            queryFactory
                .selectFrom(content)
                .where(
                    content.id.eq(id),
                    content.deletedDate.isNull()
                )
                .fetchOne()
        );
    }

    public Optional<Content> findByIdIncludingDeleted(Long id) {

        QContent content = QContent.content;

        return Optional.ofNullable(
            queryFactory
                .selectFrom(content)
                .where(content.id.eq(id))
                .fetchOne()
        );
    }

    /**
     * 무한스크롤용 전체 피드 조회. COUNT 쿼리 없이 size+1 방식으로 hasNext를 판단한다.
     * groupId가 null인 게시글만 조회한다(모임 게시글 제외).
     *
     * @return size+1 개까지 조회한 결과. 호출측은 size와 비교해 hasNext를 판단한다.
     */
    public List<Content> findAllContentsWithoutGroup(int page, int size) {

        QContent content = QContent.content;

        return queryFactory
            .selectFrom(content)
            .where(
                content.deletedDate.isNull(),
                content.groupId.isNull()
            )
            .orderBy(content.createdDate.desc())
            .offset((long) page * size)
            .limit(size + 1L)
            .fetch();
    }

    /**
     * 무한스크롤용 특정 모임 게시글 조회. COUNT 쿼리 없이 size+1 방식.
     */
    public List<Content> findAllByGroupId(Long groupId, int page, int size) {

        QContent content = QContent.content;

        return queryFactory
            .selectFrom(content)
            .where(
                content.groupId.eq(groupId),
                content.deletedDate.isNull()
            )
            .orderBy(content.createdDate.desc())
            .offset((long) page * size)
            .limit(size + 1L)
            .fetch();
    }

    /**
     * 무한스크롤용 특정 사용자의 게시글 조회. COUNT 쿼리 없이 size+1 방식.
     * groupId가 null인 게시글만 반환한다(모임 게시글 제외).
     */
    public List<Content> findAllByUsername(String username, int page, int size) {

        QContent content = QContent.content;
        QUser user = QUser.user;

        return queryFactory
            .selectFrom(content)
            .join(content.user, user)
            .where(
                user.username.eq(username),
                content.deletedDate.isNull(),
                content.groupId.isNull()
            )
            .orderBy(content.createdDate.desc())
            .offset((long) page * size)
            .limit(size + 1L)
            .fetch();
    }

    /**
     * 무한스크롤용 게시글 검색. COUNT 쿼리 없이 size+1 방식.
     */
    public List<Content> searchContents(String keyword, SearchType searchType, int page, int size) {

        QContent content = QContent.content;
        QUser user = QUser.user;
        BooleanBuilder condition = buildSearchCondition(content, user, keyword, searchType);
        condition.and(content.deletedDate.isNull());

        return queryFactory
            .selectFrom(content)
            .join(content.user, user)
            .where(condition)
            .orderBy(content.createdDate.desc())
            .offset((long) page * size)
            .limit(size + 1L)
            .fetch();
    }

    /**
     * 무한스크롤용 태그별 게시글 조회. COUNT 쿼리 없이 size+1 방식.
     */
    public List<Content> findAllByTagName(String tagName, int page, int size) {

        QContent content = QContent.content;
        QContentTag contentTag = QContentTag.contentTag;
        QTag tag = QTag.tag;

        return queryFactory
            .selectFrom(content)
            .join(contentTag).on(contentTag.content.eq(content))
            .join(contentTag.tag, tag)
            .where(
                tag.name.eq(tagName.toLowerCase()),
                content.deletedDate.isNull()
            )
            .orderBy(content.createdDate.desc())
            .offset((long) page * size)
            .limit(size + 1L)
            .fetch();
    }

    // ---- 어드민 전용 (COUNT 쿼리 유지 — 페이지 번호 UI 필요) ----

    public Page<Content> findAllContentsIncludingDeleted(Pageable pageable) {

        QContent content = QContent.content;
        QUser user = QUser.user;

        List<Content> contents = queryFactory
            .selectFrom(content)
            .join(content.user, user).fetchJoin()
            .orderBy(content.createdDate.desc(), content.id.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(content.count())
            .from(content)
            .fetchOne();

        return new PageImpl<>(contents, pageable, total != null ? total : 0);
    }

    public Page<Content> searchContentsIncludingDeleted(String keyword, Pageable pageable) {

        QContent content = QContent.content;
        QUser user = QUser.user;
        // 관리자 통합 검색: 본문 + 작성자(아이디/닉네임) OR 부분일치 (대소문자 무시)
        BooleanBuilder condition = new BooleanBuilder();
        if (keyword != null && !keyword.isBlank()) {
            condition.and(
                content.body.containsIgnoreCase(keyword)
                    .or(user.username.containsIgnoreCase(keyword))
                    .or(user.nickname.containsIgnoreCase(keyword))
            );
        }

        List<Content> contents = queryFactory
            .selectFrom(content)
            .join(content.user, user)
            .where(condition)
            .orderBy(content.createdDate.desc(), content.id.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(content.count())
            .from(content)
            .join(content.user, user)
            .where(condition)
            .fetchOne();

        return new PageImpl<>(contents, pageable, total != null ? total : 0);
    }

    public Map<String, Long> countMonthlyCreations(LocalDateTime windowStart) {

        QContent content = QContent.content;

        // 모든 도메인 시각이 KST 로 저장되므로(별도 타임존 변환 불필요),
        // YYYY-MM 포맷팅만 수행하는 커스텀 HQL 함수(to_char_kst_month)를 사용한다.
        // 함수 등록: global.persistence.PostgresKstFunctionContributor
        StringExpression monthExpr = Expressions.stringTemplate(
            "function('to_char_kst_month', {0})", content.createdDate);

        var countExpr = content.count();

        List<Tuple> results = queryFactory
            .select(monthExpr, countExpr)
            .from(content)
            .where(
                content.deletedDate.isNull(),
                content.createdDate.goe(windowStart)
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

    private BooleanBuilder buildSearchCondition(QContent content, QUser user, String keyword, SearchType searchType) {

        BooleanBuilder builder = new BooleanBuilder();

        if (keyword == null || keyword.isBlank()) {
            return builder;
        }

        if (searchType == SearchType.USERNAME) {
            builder.and(user.username.containsIgnoreCase(keyword));
        } else {
            builder.and(content.body.containsIgnoreCase(keyword));
        }

        return builder;
    }

}
