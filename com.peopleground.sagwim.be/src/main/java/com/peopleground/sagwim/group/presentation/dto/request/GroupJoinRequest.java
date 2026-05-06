package com.peopleground.sagwim.group.presentation.dto.request;

import jakarta.validation.constraints.Size;

public record GroupJoinRequest(
    @Size(max = 1000)
    String answer
) {}
