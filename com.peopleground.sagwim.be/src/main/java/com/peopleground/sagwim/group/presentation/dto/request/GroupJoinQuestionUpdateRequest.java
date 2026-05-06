package com.peopleground.sagwim.group.presentation.dto.request;

import jakarta.validation.constraints.Size;

public record GroupJoinQuestionUpdateRequest(
    @Size(max = 500)
    String question
) {}
