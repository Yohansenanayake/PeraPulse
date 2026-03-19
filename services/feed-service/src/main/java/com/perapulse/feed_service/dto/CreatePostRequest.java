package com.perapulse.feed_service.dto;

import jakarta.validation.constraints.NotBlank;

public record CreatePostRequest(
        @NotBlank(message = "Post content must not be blank")
        String content,
        String mediaUrl
) {
}
