package com.perapulse.feed_service.kafka;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class FeedEventPublisher {

    private static final String TOPIC = "perapulse.feed.events";

    private final KafkaTemplate<String, FeedEvent> kafkaTemplate;

    public void publishPostCreated(UUID postId, String authorSub, String snippet) {
        publish("PostCreated", Map.of(
                "postId", postId.toString(),
                "authorSub", authorSub,
                "contentSnippet", snippet));
    }

    public void publishPostLiked(UUID postId, String likerSub, String authorSub) {
        publish("PostLiked", Map.of(
                "postId", postId.toString(),
                "likerSub", likerSub,
                "authorSub", authorSub));
    }

    public void publishCommentAdded(UUID postId, UUID commentId,
                                     String commenterSub, String authorSub) {
        publish("CommentAdded", Map.of(
                "postId", postId.toString(),
                "commentId", commentId.toString(),
                "commenterSub", commenterSub,
                "authorSub", authorSub));
    }

    private void publish(String eventType, Map<String, Object> data) {
        FeedEvent event = FeedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .timestamp(Instant.now())
                .producer("feed-service")
                .data(data)
                .build();

        kafkaTemplate.send(TOPIC, event.getEventId(), event);
        log.info("Published {} event: {}", eventType, event.getEventId());
    }
}
