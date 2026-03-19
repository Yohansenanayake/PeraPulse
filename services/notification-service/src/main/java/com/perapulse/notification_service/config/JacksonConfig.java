package com.perapulse.notification_service.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                // Handle java.time types (Instant, LocalDateTime, etc.)
                .registerModule(new JavaTimeModule())
                // Don't fail on unknown JSON fields in Kafka event payloads
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                // Write dates as ISO strings, not timestamps
                .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
    }
}
