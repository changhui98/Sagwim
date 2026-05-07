package com.peopleground.sagwim.place.application;

import com.peopleground.sagwim.place.application.port.PlaceAutocompletePort;
import com.peopleground.sagwim.place.presentation.dto.response.PlaceSuggestionResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlaceService {

    private final PlaceAutocompletePort placeAutocompletePort;

    public List<PlaceSuggestionResponse> searchAutocomplete(String query) {
        String keyword = query == null ? "" : query.trim();
        if (keyword.length() < 2) {
            return List.of();
        }
        return placeAutocompletePort.autocomplete(keyword);
    }

    /**
     * 주소 자동완성 검색 결과를 fullAddress 문자열 목록으로 반환한다.
     * 프로필 주소 편집 페이지의 드롭다운 자동완성에서 사용한다.
     */
    public List<String> searchAddressSuggestions(String query) {
        return searchAutocomplete(query).stream()
            .map(PlaceSuggestionResponse::fullAddress)
            .filter(address -> address != null && !address.isBlank())
            .toList();
    }
}
