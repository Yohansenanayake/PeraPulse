package com.perapulse.opportunities_service.messaging;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.perapulse.opportunities_service.domain.Application;
import com.perapulse.opportunities_service.domain.Opportunity;

@Component
public class OpportunityEventPublisher {

    private static final String TOPIC = "perapulse.opportunities.events";
    private final KafkaTemplate<String, OpportunityEvent> kafkaTemplate;

    public OpportunityEventPublisher(KafkaTemplate<String, OpportunityEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishOpportunityPosted(Opportunity opportunity) {
        Map<String, Object> data = Map.of(
            "opportunityId", opportunity.getId(),
            "title", opportunity.getTitle(),
            "company", opportunity.getCompany(),
            "type", opportunity.getType(),
            "createdBySub", opportunity.getCreatedBySub()
        );
        publish("OpportunityPosted", opportunity.getId().toString(), data);
    }

    public void publishApplicationSubmitted(Application application, String listingOwnerSub) {
        Map<String, Object> data = Map.of(
            "applicationId", application.getId(),
            "opportunityId", application.getOpportunityId(),
            "applicantSub", application.getApplicantSub(),
            "listingOwnerSub", listingOwnerSub
        );
        publish("ApplicationSubmitted", application.getId().toString(), data);
    }

    public void publishApplicationStatusUpdated(Application application) {
        Map<String, Object> data = Map.of(
            "applicationId", application.getId(),
            "opportunityId", application.getOpportunityId(),
            "applicantSub", application.getApplicantSub(),
            "newStatus", application.getStatus()
        );
        publish("ApplicationStatusUpdated", application.getId().toString(), data);
    }

    private void publish(String eventType, String key, Map<String, Object> data) {
        OpportunityEvent event = new OpportunityEvent(
            UUID.randomUUID().toString(),
            eventType,
            Instant.now().toString(),
            "opportunities-service",
            TOPIC,
            data
        );
        kafkaTemplate.send(TOPIC, key, event);
    }
}
