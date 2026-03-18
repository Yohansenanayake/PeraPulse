package com.perapulse.notification_service.config;

import com.perapulse.notification_service.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sends periodic keep-alive comments to all open SSE connections.
 * Prevents proxies, load balancers, and browsers from closing idle streams.
 * The comment character ":" is part of the SSE spec and is safely ignored by clients.
 */
@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class SseKeepAliveScheduler {

    private final SseEmitterRegistry sseEmitterRegistry;

    /**
     * Every 25 seconds — well within the typical 30s proxy idle timeout.
     */
    @Scheduled(fixedDelay = 25_000)
    public void sendKeepAlive() {
        int count = sseEmitterRegistry.activeConnectionCount();
        if (count > 0) {
            sseEmitterRegistry.sendKeepAlive();
            log.debug("Keep-alive sent to {} SSE connections", count);
        }
    }
}
