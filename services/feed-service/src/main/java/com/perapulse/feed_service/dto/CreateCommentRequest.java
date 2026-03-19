package com.perapulse.feed_service.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCommentRequest(
        @NotBlank(message = "Comment text must not be blank")
        String text
) {
}
