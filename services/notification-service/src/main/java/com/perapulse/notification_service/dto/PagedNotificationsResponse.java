package com.perapulse.notification_service.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Paginated wrapper for notification lists.
 * Matches the PagedNotifications schema in the OpenAPI spec.
 */
@Data
@Builder
public class PagedNotificationsResponse {
    private List<NotificationResponse> content;
    private long totalElements;
    private int page;
    private int size;
    private long unreadCount;
}
