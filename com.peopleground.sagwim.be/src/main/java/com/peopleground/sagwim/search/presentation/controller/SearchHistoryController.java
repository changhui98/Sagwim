package com.peopleground.sagwim.search.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.search.application.SearchHistoryService;
import com.peopleground.sagwim.search.presentation.dto.request.SearchHistoryRequest;
import com.peopleground.sagwim.search.presentation.dto.response.SearchHistoryResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users/me/search-history")
public class SearchHistoryController {

    private final SearchHistoryService searchHistoryService;

    /**
     * 검색 결과에서 상세로 진입한 항목을 최근 검색 기록에 저장한다.
     * POST /api/v1/users/me/search-history
     */
    @PostMapping
    public ResponseEntity<Void> save(
        @Valid @RequestBody SearchHistoryRequest request,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        searchHistoryService.save(customUser, request.type(), request.targetId());
        return ResponseEntity.ok().build();
    }

    /**
     * 최근 검색 기록을 최근 본 순으로 조회한다.
     * GET /api/v1/users/me/search-history?limit=20
     */
    @GetMapping
    public ResponseEntity<List<SearchHistoryResponse>> getRecent(
        @RequestParam(defaultValue = "20") int limit,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        return ResponseEntity.ok(searchHistoryService.getRecent(customUser, limit));
    }
}
