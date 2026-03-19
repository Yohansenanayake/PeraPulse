package com.perapulse.feed_service.kafka;

import java.time.Instant;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedEvent {

    private String eventId;
    private String eventType;
    private Instant timestamp;
    private String producer;
    private Map<String, Object> data;
}
