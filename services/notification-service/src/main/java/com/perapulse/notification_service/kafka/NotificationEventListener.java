package com.perapulse.notification_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perapulse.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Listens to all 4 PeraPulse Kafka topics and delegates
 * notification creation to NotificationService.
 *
 * Topics & events handled (per project_proposal.md §8):
 *
 * perapulse.feed.events
 *   PostLiked         → notify post author
 *   CommentAdded      → notify post author
 *
 * perapulse.opportunities.events
 *   OpportunityPosted         → notify ALL_STUDENTS
 *   ApplicationSubmitted      → notify listing owner
 *   ApplicationStatusUpdated  → notify applicant
 *
 * perapulse.platform.events
 *   EventCreated  → notify ALL_USERS
 *
 * perapulse.user.events
 *   RoleRequestSubmitted → notify ALL_ADMINS
 *   RoleRequestApproved  → notify requesting user
 *   RoleRequestRejected  → notify requesting user
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("NotificationEventListener Bean loaded!");
    }

    // ─── Feed Events ──────────────────────────────────────────────────────────

    @KafkaListener(topics = "perapulse.feed.events", groupId = "notification-service-cg")
    public void handleFeedEvent(String message) {
        try {
            PlatformEvent event = objectMapper.readValue(message, PlatformEvent.class);
            Map<String, Object> data = event.getData();

            switch (event.getEventType()) {
                case "PostLiked" -> {
                    String authorSub = (String) data.get("authorSub");
                    String likerSub  = (String) data.get("likerSub");
                    if (authorSub != null && !authorSub.equals(likerSub)) {
                        // Don't notify user if they liked their own post
                        notificationService.createAndPush(
                                authorSub,
                                "POST_LIKED",
                                "Someone liked your post",
                                "A user liked your post."
                        );
                    }
                }
                case "CommentAdded" -> {
                    String authorSub    = (String) data.get("authorSub");
                    String commenterSub = (String) data.get("commenterSub");
                    if (authorSub != null && !authorSub.equals(commenterSub)) {
                        notificationService.createAndPush(
                                authorSub,
                                "COMMENT_ADDED",
                                "Someone commented on your post",
                                "A user left a comment on your post."
                        );
                    }
                }
                default -> log.debug("Ignored feed event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error processing feed event: {}", e.getMessage(), e);
        }
    }

    // ─── Opportunities Events ─────────────────────────────────────────────────

    @KafkaListener(topics = "perapulse.opportunities.events", groupId = "notification-service-cg")
    public void handleOpportunitiesEvent(String message) {
        try {
            PlatformEvent event = objectMapper.readValue(message, PlatformEvent.class);
            Map<String, Object> data = event.getData();

            switch (event.getEventType()) {
                case "OpportunityPosted" -> {
                    String title   = (String) data.get("title");
                    String company = (String) data.get("company");
                    notificationService.broadcastToStudents(
                            "OPPORTUNITY_POSTED",
                            "New opportunity: " + title + " at " + company,
                            "A new job/internship posting is available. Check it out!"
                    );
                }
                case "ApplicationSubmitted" -> {
                    String listingOwnerSub = (String) data.get("listingOwnerSub");
                    if (listingOwnerSub != null) {
                        notificationService.createAndPush(
                                listingOwnerSub,
                                "APPLICATION_SUBMITTED",
                                "New application received",
                                "Someone applied to your job/internship listing."
                        );
                    }
                }
                case "ApplicationStatusUpdated" -> {
                    String applicantSub = (String) data.get("applicantSub");
                    String newStatus    = (String) data.get("newStatus");
                    if (applicantSub != null) {
                        notificationService.createAndPush(
                                applicantSub,
                                "APPLICATION_STATUS_UPDATED",
                                "Your application status changed",
                                "Your application status has been updated to: " + newStatus
                        );
                    }
                }
                default -> log.debug("Ignored opportunities event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error processing opportunities event: {}", e.getMessage(), e);
        }
    }

    // ─── Platform Events (Events Service) ────────────────────────────────────

    @KafkaListener(topics = "perapulse.platform.events", groupId = "notification-service-cg")
    public void handlePlatformEvent(String message) {
        try {
            PlatformEvent event = objectMapper.readValue(message, PlatformEvent.class);
            Map<String, Object> data = event.getData();

            switch (event.getEventType()) {
                case "EventCreated" -> {
                    String title = (String) data.get("title");
                    notificationService.broadcastToAll(
                            "EVENT_CREATED",
                            "New event: " + title,
                            "A new department event has been posted. Check it out!"
                    );
                }
                // RSVPUpdated — no notification required per proposal
                default -> log.debug("Ignored platform event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error processing platform event: {}", e.getMessage(), e);
        }
    }

    // ─── User Events ──────────────────────────────────────────────────────────

    @KafkaListener(topics = "perapulse.user.events", groupId = "notification-service-cg")
    public void handleUserEvent(String message) {
        try {
            PlatformEvent event = objectMapper.readValue(message, PlatformEvent.class);
            Map<String, Object> data = event.getData();

            switch (event.getEventType()) {
                case "RoleRequestSubmitted" -> {
                    String displayName = (String) data.get("displayName");
                    notificationService.broadcastToAdmins(
                            "ROLE_REQUEST_SUBMITTED",
                            "New alumni role request",
                            "A new alumni role request was submitted by " + displayName + ". Please review it."
                    );
                }
                case "RoleRequestApproved" -> {
                    String userSub = (String) data.get("userSub");
                    if (userSub != null) {
                        notificationService.createAndPush(
                                userSub,
                                "ROLE_REQUEST_APPROVED",
                                "Alumni role request approved",
                                "Your alumni role request has been approved! Please log out and log in again for the changes to take effect."
                        );
                    }
                }
                case "RoleRequestRejected" -> {
                    String userSub = (String) data.get("userSub");
                    if (userSub != null) {
                        notificationService.createAndPush(
                                userSub,
                                "ROLE_REQUEST_REJECTED",
                                "Alumni role request rejected",
                                "Your alumni role request has been reviewed and rejected."
                        );
                    }
                }
                default -> log.debug("Ignored user event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error processing user event: {}", e.getMessage(), e);
        }
    }
}
