package com.perapulse.notification_service.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory registry of active SSE connections.
 * Keyed by Keycloak subject (userSub).
 *
 * Broadcast marker keys:
 *   "ALL_USERS"    — every authenticated user
 *   "ALL_STUDENTS" — users with the STUDENT role
 *   "ALL_ADMINS"   — users with the ADMIN role
 */
@Slf4j
@Component
public class SseEmitterRegistry {

    /** SSE timeout: 1 hour. Client must reconnect after this. */
    private static final long SSE_TIMEOUT_MS = 60 * 60 * 1000L;

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * Register a new SSE connection for the given user.
     * Replaces any existing connection (e.g., user reconnected in a new tab).
     */
    public SseEmitter register(String userSub) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        emitter.onCompletion(() -> {
            emitters.remove(userSub);
            log.debug("SSE emitter completed for user: {}", userSub);
        });
        emitter.onTimeout(() -> {
            emitters.remove(userSub);
            log.debug("SSE emitter timed out for user: {}", userSub);
        });
        emitter.onError(ex -> {
            emitters.remove(userSub);
            log.debug("SSE emitter error for user {}: {}", userSub, ex.getMessage());
        });

        emitters.put(userSub, emitter);
        log.debug("SSE emitter registered for user: {}. Total connections: {}", userSub, emitters.size());
        return emitter;
    }

    /**
     * Push a notification event to a specific user's SSE stream.
     */
    public void send(String userSub, Object data) {
        SseEmitter emitter = emitters.get(userSub);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(data));
            } catch (IOException e) {
                log.warn("Failed to send SSE to user {}, removing emitter: {}", userSub, e.getMessage());
                emitters.remove(userSub);
            }
        }
    }

    /**
     * Broadcast a notification to all currently connected users.
     * Used for ALL_USERS events (e.g., EventCreated).
     */
    public void broadcastToAll(Object data) {
        emitters.forEach((sub, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(data));
            } catch (IOException e) {
                log.warn("Failed to broadcast SSE to user {}, removing emitter: {}", sub, e.getMessage());
                emitters.remove(sub);
            }
        });
    }

    /**
     * Broadcast a notification to all users with a given role.
     * userRole should be "STUDENT" or "ADMIN".
     * We track this by having the emitter key prefixed in the registry when registering.
     * For simplicity, we use a separate map for role-tagged emitters.
     */
    private final Map<String, String> userRoles = new ConcurrentHashMap<>();

    /**
     * Register a user's emitter along with their realm role for targeted broadcasts.
     */
    public SseEmitter register(String userSub, String role) {
        userRoles.put(userSub, role != null ? role.toUpperCase() : "STUDENT");
        return register(userSub);
    }

    /**
     * Broadcast to all connected users that have the given role.
     * role: "STUDENT" or "ADMIN"
     */
    public void broadcastToRole(String role, Object data) {
        String upperRole = role.toUpperCase();
        emitters.forEach((sub, emitter) -> {
            if (upperRole.equals(userRoles.getOrDefault(sub, "STUDENT"))) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("notification")
                            .data(data));
                } catch (IOException e) {
                    log.warn("Failed to send role-broadcast SSE to {}: {}", sub, e.getMessage());
                    emitters.remove(sub);
                }
            }
        });
    }

    /**
     * Send a keep-alive comment to prevent proxy/browser timeouts.
     * Call this periodically (e.g., via @Scheduled every 25s).
     */
    public void sendKeepAlive() {
        emitters.forEach((sub, emitter) -> {
            try {
                emitter.send(SseEmitter.event().comment("keep-alive"));
            } catch (IOException e) {
                emitters.remove(sub);
            }
        });
    }

    public int activeConnectionCount() {
        return emitters.size();
    }
}
