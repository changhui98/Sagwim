package com.peopleground.sagwim.chat.presentation.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateDirectRoomRequest(
    @NotNull UUID targetUserId
) {}
