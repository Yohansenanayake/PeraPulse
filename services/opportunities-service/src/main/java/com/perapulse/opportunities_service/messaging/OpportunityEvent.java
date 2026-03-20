package com.perapulse.opportunities_service.messaging;

/**
 * Standard event envelope for PeraPulse.
 */
public record OpportunityEvent(
    String eventId,
    String eventType,
    String timestamp,
    String producer,
    String topic,
    Object data
) {}
