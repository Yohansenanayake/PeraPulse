package com.perapulse.feed_service.dto;

import java.time.Instant;
import java.util.UUID;

public record PostResponse(
        UUID id,
        String authorSub,
        String authorName,
        String authorAvatarUrl,
        String content,
        String mediaUrl,
        long likeCount,
        boolean likedByMe,
        long commentCount,
        Instant createdAt
) {
}
