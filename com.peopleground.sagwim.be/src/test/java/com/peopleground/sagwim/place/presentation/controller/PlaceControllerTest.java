package com.peopleground.sagwim.place.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.place.application.PlaceService;
import com.peopleground.sagwim.place.presentation.dto.response.AddressSearchResponse;
import com.peopleground.sagwim.place.presentation.dto.response.PlaceSuggestionResponse;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class PlaceControllerTest {

    @Mock PlaceService placeService;
    @InjectMocks PlaceController controller;

    @Test
    @DisplayName("장소 자동완성 성공")
    void autocomplete_success() {
        List<PlaceSuggestionResponse> mockRes = List.of(new PlaceSuggestionResponse("place1", "서울역", "서울시", "서울시 중구 서울역"));
        given(placeService.searchAutocomplete("서울")).willReturn(mockRes);

        ResponseEntity<List<PlaceSuggestionResponse>> res = controller.autocomplete("서울");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(1);
    }

    @Test
    @DisplayName("장소 자동완성 - 빈 결과 반환")
    void autocomplete_empty() {
        given(placeService.searchAutocomplete("없는장소xyz")).willReturn(List.of());

        ResponseEntity<List<PlaceSuggestionResponse>> res = controller.autocomplete("없는장소xyz");

        assertThat(res.getBody()).isEmpty();
    }

    @Test
    @DisplayName("장소 자동완성 - 외부 API 오류 시 예외 전파")
    void autocomplete_externalApiError() {
        given(placeService.searchAutocomplete("서울")).willThrow(new AppException(ApiErrorCode.EXTERNAL_API_ERROR));

        assertThatThrownBy(() -> controller.autocomplete("서울"))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("주소 검색 성공")
    void searchAddress_success() {
        List<String> suggestions = List.of("서울시 강남구", "서울시 강북구");
        given(placeService.searchAddressSuggestions("서울")).willReturn(suggestions);

        ResponseEntity<AddressSearchResponse> res = controller.searchAddress("서울");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().suggestions()).hasSize(2);
    }

    @Test
    @DisplayName("주소 검색 - 짧은 쿼리는 빈 목록 반환")
    void searchAddress_shortQuery() {
        given(placeService.searchAddressSuggestions("서")).willReturn(List.of());

        ResponseEntity<AddressSearchResponse> res = controller.searchAddress("서");

        assertThat(res.getBody().suggestions()).isEmpty();
    }
}
