package com.perapulse.notification_service.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for a single notification.
 * Returned by both REST endpoints and SSE push events.
 */
@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private String userSub;
    private String type;
    private String title;
    private String body;
    private boolean read;
    private Instant createdAt;
}
