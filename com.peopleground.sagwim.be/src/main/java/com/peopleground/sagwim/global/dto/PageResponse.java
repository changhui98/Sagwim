package com.peopleground.sagwim.global.dto;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;

public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean hasNext
) {
    public static <T, S extends T> PageResponse<T> from(Page<S> page) {
        return new PageResponse<>(
            new ArrayList<>(page.getContent()),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.hasNext()
        );
    }

    /**
     * COUNT 쿼리 없이 hasNext 방식으로 조립하는 팩토리.
     * 무한스크롤 API 전용: totalElements/totalPages 는 0으로 설정됩니다.
     * 호출측은 content.size() == size+1 여부를 미리 계산해 hasNext를 전달해야 합니다.
     */
    public static <T> PageResponse<T> ofSlice(List<T> content, int page, int size, boolean hasNext) {
        return new PageResponse<>(content, page, size, 0L, 0, hasNext);
    }

    /**
     * size+1 로 조회된 결과에서 마지막 1건 초과 여부로 hasNext 를 판단하고,
     * 호출측 리스트에서 초과분을 제거한다.
     *
     * <p>무한스크롤 API 의 size+1 패턴 전용 헬퍼.</p>
     */
    public static <T> boolean trim(List<T> results, int size) {
        if (results.size() > size) {
            results.remove(results.size() - 1);
            return true;
        }
        return false;
    }
}
