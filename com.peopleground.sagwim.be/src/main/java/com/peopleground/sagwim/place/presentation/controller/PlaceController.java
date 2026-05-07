package com.peopleground.sagwim.place.presentation.controller;

import com.peopleground.sagwim.place.application.PlaceService;
import com.peopleground.sagwim.place.presentation.dto.response.AddressSearchResponse;
import com.peopleground.sagwim.place.presentation.dto.response.PlaceSuggestionResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceService placeService;

    @GetMapping("/api/v1/places/autocomplete")
    public ResponseEntity<List<PlaceSuggestionResponse>> autocomplete(
        @RequestParam String query
    ) {
        List<PlaceSuggestionResponse> response = placeService.searchAutocomplete(query);
        return ResponseEntity.ok(response);
    }

    /**
     * 주소 자동완성 검색 API.
     * 프로필 주소 편집 페이지의 드롭다운 자동완성에서 사용한다.
     * query가 2자 미만이면 빈 목록을 반환한다.
     */
    @GetMapping("/api/v1/address/search")
    public ResponseEntity<AddressSearchResponse> searchAddress(
        @RequestParam String query
    ) {
        List<String> suggestions = placeService.searchAddressSuggestions(query);
        return ResponseEntity.ok(new AddressSearchResponse(suggestions));
    }
}
