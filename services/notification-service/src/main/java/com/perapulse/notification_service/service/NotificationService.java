package com.perapulse.notification_service.service;

import com.perapulse.notification_service.dto.NotificationResponse;
import com.perapulse.notification_service.dto.PagedNotificationsResponse;
import com.perapulse.notification_service.model.Notification;
import com.perapulse.notification_service.repository.NotificationRepository;
import com.perapulse.notification_service.sse.SseEmitterRegistry;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SseEmitterRegistry sseEmitterRegistry;

    /**
     * Create a personal notification for a specific user and immediately
     * push it to their SSE stream if they are currently connected.
     */
    @Transactional
    public void createAndPush(String userSub, String type, String title, String body) {
        Notification notification = save(userSub, type, title, body);
        NotificationResponse response = toResponse(notification);
        sseEmitterRegistry.send(userSub, response);
        log.debug("Notification created and pushed for user {}: {}", userSub, type);
    }

    /**
     * Create a broadcast notification for ALL_USERS and push to all open SSE connections.
     */
    @Transactional
    public void broadcastToAll(String type, String title, String body) {
        save("ALL_USERS", type, title, body);
        NotificationResponse response = NotificationResponse.builder()
                .userSub("ALL_USERS").type(type).title(title).body(body).read(false).build();
        sseEmitterRegistry.broadcastToAll(response);
        log.debug("Broadcast notification sent to ALL_USERS: {}", type);
    }

    /**
     * Create a broadcast notification for ALL_STUDENTS and push to connected students.
     */
    @Transactional
    public void broadcastToStudents(String type, String title, String body) {
        save("ALL_STUDENTS", type, title, body);
        NotificationResponse response = NotificationResponse.builder()
                .userSub("ALL_STUDENTS").type(type).title(title).body(body).read(false).build();
        sseEmitterRegistry.broadcastToRole("STUDENT", response);
        log.debug("Broadcast notification sent to ALL_STUDENTS: {}", type);
    }

    /**
     * Create a broadcast notification for ALL_ADMINS and push to connected admins.
     */
    @Transactional
    public void broadcastToAdmins(String type, String title, String body) {
        save("ALL_ADMINS", type, title, body);
        NotificationResponse response = NotificationResponse.builder()
                .userSub("ALL_ADMINS").type(type).title(title).body(body).read(false).build();
        sseEmitterRegistry.broadcastToRole("ADMIN", response);
        log.debug("Broadcast notification sent to ALL_ADMINS: {}", type);
    }

    /**
     * Retrieve paginated notifications for a user including relevant broadcasts.
     */
    public PagedNotificationsResponse getNotifications(String userSub, String role, int page, int size) {
        List<String> subs = buildSubList(userSub, role);
        Page<Notification> result = notificationRepository
                .findByUserSubInOrderByCreatedAtDesc(subs, PageRequest.of(page, size));
        long unreadCount = notificationRepository.countByUserSubInAndReadFalse(subs);

        return PagedNotificationsResponse.builder()
                .content(result.getContent().stream().map(this::toResponse).toList())
                .totalElements(result.getTotalElements())
                .page(page)
                .size(size)
                .unreadCount(unreadCount)
                .build();
    }

    /**
     * Get unread notification count for a user including broadcasts.
     */
    public long getUnreadCount(String userSub, String role) {
        return notificationRepository.countByUserSubInAndReadFalse(buildSubList(userSub, role));
    }

    /**
     * Mark a single notification as read.
     */
    @Transactional
    public void markAsRead(UUID id, String userSub, String role) {
        int updated = notificationRepository.markAsRead(id, buildSubList(userSub, role));
        if (updated == 0) {
            log.warn("markAsRead: notification {} not found or not owned by {}", id, userSub);
        }
    }

    /**
     * Mark all notifications as read for a user.
     */
    @Transactional
    public void markAllAsRead(String userSub, String role) {
        notificationRepository.markAllAsRead(buildSubList(userSub, role));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Notification save(String userSub, String type, String title, String body) {
        return notificationRepository.save(
                Notification.builder()
                        .userSub(userSub)
                        .type(type)
                        .title(title)
                        .body(body)
                        .build());
    }

    /**
     * Build the list of sub values to query — personal + relevant broadcast markers.
     * role: the user's Keycloak realm role (STUDENT, ALUMNI, ADMIN)
     */
    private List<String> buildSubList(String userSub, String role) {
        // Everyone sees ALL_USERS broadcasts
        if ("ADMIN".equalsIgnoreCase(role)) {
            return List.of(userSub, "ALL_USERS", "ALL_ADMINS");
        } else if ("STUDENT".equalsIgnoreCase(role)) {
            return List.of(userSub, "ALL_USERS", "ALL_STUDENTS");
        } else {
            // ALUMNI or unknown — gets ALL_USERS only
            return List.of(userSub, "ALL_USERS");
        }
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userSub(n.getUserSub())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
