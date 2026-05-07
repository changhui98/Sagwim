package com.peopleground.sagwim.group.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record GroupJoinQuestionsUpdateRequest(
    @NotNull
    @Size(max = 5)
    List<@NotBlank @Size(max = 500) String> questions
) {}
