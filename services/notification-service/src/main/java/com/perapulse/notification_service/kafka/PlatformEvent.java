package com.perapulse.notification_service.kafka;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Generic event envelope matching the PeraPulse Kafka event contract:
 * {
 *   "eventId":   "uuid",
 *   "eventType": "PostLiked",
 *   "timestamp": "ISO-8601",
 *   "producer":  "feed-service",
 *   "topic":     "perapulse.feed.events",
 *   "data": { ... }
 * }
 *
 * The `data` map holds event-specific fields (see project_proposal.md §8).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlatformEvent {
    private String eventId;
    private String eventType;
    private String timestamp;
    private String producer;
    private String topic;
    private Map<String, Object> data;
}
