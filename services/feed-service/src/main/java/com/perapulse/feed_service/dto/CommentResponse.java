package com.perapulse.feed_service.dto;

import java.time.Instant;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        String authorSub,
        String authorName,
        String text,
        Instant createdAt
) {
}
