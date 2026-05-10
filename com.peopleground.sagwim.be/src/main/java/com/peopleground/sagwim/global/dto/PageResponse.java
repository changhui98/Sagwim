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
}
