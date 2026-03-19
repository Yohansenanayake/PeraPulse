package com.perapulse.notification_service.web;

import com.perapulse.notification_service.dto.PagedNotificationsResponse;
import com.perapulse.notification_service.service.NotificationService;
import com.perapulse.notification_service.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SseEmitterRegistry  sseEmitterRegistry;

    // ─── SSE Stream ───────────────────────────────────────────────────────────

    /**
     * Open an SSE stream for real-time notification delivery.
     *
     * GET /api/notifications/stream
     *
     * The client attaches its JWT as a bearer token header. Spring Security
     * validates the JWT before reaching this method, so @AuthenticationPrincipal
     * is always populated.
     *
     * On connection, this endpoint:
     *   1. Registers the user's emitter in the SSE registry (with their role)
     *   2. Sends a "connected" confirmation event
     *   3. Returns the long-lived SseEmitter — Spring MVC holds the connection open
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal Jwt jwt) {
        String userSub = extractUserSub(jwt);
        String role    = extractRole(jwt);

        SseEmitter emitter = sseEmitterRegistry.register(userSub, role);
        log.info("SSE stream opened for user: {} (role: {})", userSub, role);

        // Send a connection-confirmed event so the client knows the stream is live
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("status", "connected", "userSub", userSub)));
        } catch (Exception e) {
            log.warn("Failed to send connected event to {}", userSub);
        }

        return emitter;
    }

    // ─── REST Endpoints ───────────────────────────────────────────────────────

    /**
     * GET /api/notifications
     * Retrieve paginated notifications (personal + broadcast) newest first.
     */
    @GetMapping
    public ResponseEntity<PagedNotificationsResponse> getNotifications(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        String userSub = extractUserSub(jwt);
        String role    = extractRole(jwt);
        PagedNotificationsResponse response =
                notificationService.getNotifications(userSub, role, page, size);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/notifications/unread-count
     * Returns count of unread notifications.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal Jwt jwt) {
        String userSub = extractUserSub(jwt);
        String role    = extractRole(jwt);
        long count = notificationService.getUnreadCount(userSub, role);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * POST /api/notifications/{id}/read
     * Mark a single notification as read.
     */
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        notificationService.markAsRead(id, extractUserSub(jwt), extractRole(jwt));
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/notifications/read-all
     * Mark all notifications as read for the current user.
     */
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal Jwt jwt) {
        notificationService.markAllAsRead(extractUserSub(jwt), extractRole(jwt));
        return ResponseEntity.ok().build();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Safely extract the user subject, falling back to preferred_username if sub is missing
     * (which can happen with Keycloak Direct Access Grants).
     */
    private String extractUserSub(Jwt jwt) {
        String sub = jwt.getSubject();
        return (sub != null) ? sub : jwt.getClaimAsString("preferred_username");
    }

    /**
     * Extract the user's primary realm role from the JWT.
     * Keycloak puts realm roles in: realm_access.roles
     */
    @SuppressWarnings("unchecked")
    private String extractRole(Jwt jwt) {
        try {
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null) {
                List<String> roles = (List<String>) realmAccess.get("roles");
                if (roles != null) {
                    if (roles.contains("ADMIN"))   return "ADMIN";
                    if (roles.contains("ALUMNI"))  return "ALUMNI";
                    if (roles.contains("STUDENT")) return "STUDENT";
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract role from JWT for sub {}: {}", jwt.getSubject(), e.getMessage());
        }
        return "STUDENT"; // safe default
    }
}
