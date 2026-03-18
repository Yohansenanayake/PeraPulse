package com.perapulse.notification_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Keycloak subject of the target user.
     * Broadcast values: "ALL_USERS", "ALL_STUDENTS", "ALL_ADMINS"
     */
    @Column(name = "user_sub", nullable = false)
    private String userSub;

    /**
     * Event type e.g. POST_LIKED, COMMENT_ADDED, OPPORTUNITY_POSTED, EVENT_CREATED, etc.
     */
    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Builder.Default
    @Column(nullable = false)
    private boolean read = false;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
