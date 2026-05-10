package com.peopleground.sagwim.chat.presentation.dto.request;

import jakarta.validation.constraints.NotNull;

public record MarkAsReadRequest(
    @NotNull Long lastMessageId
) {}
