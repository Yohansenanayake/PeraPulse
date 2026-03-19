# Notification Service — Implementation Notes

> **Owner:** Tharusha  
> **Date:** March 2026  
> **Status:** Compiled successfully — ready for integration testing

---

## Goal

Implement the `notification-service` microservice for PeraPulse:

- Consume Kafka events from all 4 domain topics
- Persist notifications to PostgreSQL (`notification_db`)
- Push notifications to connected web clients in real-time using Server-Sent Events (SSE)
- Expose REST endpoints for notification history and read-state management
- Secure all endpoints with Keycloak JWT (same pattern as `user-service`)

---

## What Was Built

### notification-service (Spring Boot 4.0.3 / Java 21)

| Component | Detail |
|-----------|--------|
| **Port** | `8085` |
| **Database** | `notification_db` on shared PostgreSQL instance |
| **Kafka consumer group** | `notification-service-cg` |
| **Topics consumed** | All 4: feed, opportunities, platform, user |
| **Events handled** | 9 event types (see table below) |
| **SSE** | `SseEmitterRegistry` — `ConcurrentHashMap<userSub, SseEmitter>` |
| **Keep-alive** | `SseKeepAliveScheduler` — `@Scheduled` every 25s |
| **Security** | OAuth2 Resource Server, Keycloak JWKS |

### Kafka Event Coverage

| Topic | Event | Target | SSE Method |
|-------|-------|--------|------------|
| `perapulse.feed.events` | `PostLiked` | Post author | `send(authorSub)` |
| `perapulse.feed.events` | `CommentAdded` | Post author | `send(authorSub)` |
| `perapulse.opportunities.events` | `OpportunityPosted` | All students | `broadcastToRole("STUDENT")` |
| `perapulse.opportunities.events` | `ApplicationSubmitted` | Listing owner | `send(listingOwnerSub)` |
| `perapulse.opportunities.events` | `ApplicationStatusUpdated` | Applicant | `send(applicantSub)` |
| `perapulse.platform.events` | `EventCreated` | All users | `broadcastToAll()` |
| `perapulse.user.events` | `RoleRequestSubmitted` | All admins | `broadcastToRole("ADMIN")` |
| `perapulse.user.events` | `RoleRequestApproved` | Requesting user | `send(userSub)` |
| `perapulse.user.events` | `RoleRequestRejected` | Requesting user | `send(userSub)` |

### REST API Surface

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications/stream` | SSE stream — real-time push |
| `GET` | `/api/notifications` | Paginated notification history |
| `GET` | `/api/notifications/unread-count` | Unread count |
| `POST` | `/api/notifications/{id}/read` | Mark one as read |
| `POST` | `/api/notifications/read-all` | Mark all as read |

All endpoints require `Authorization: Bearer <token>` (Keycloak JWT).

---

## Key Design Decisions

### Broadcast via marker `user_sub`

Broadcast notifications (e.g., `EventCreated` → all users) are stored with a marker `user_sub` value instead of duplicating rows per user:

- `ALL_USERS` — fetched for every role
- `ALL_STUDENTS` — fetched for users with `STUDENT` role
- `ALL_ADMINS` — fetched for users with `ADMIN` role

The REST query and SSE broadcast both resolve the correct sub list from the user's JWT role at request/push time. This keeps the service fully decoupled from user-service.

### SSE registry with role tagging

When a user opens the SSE stream (`GET /api/notifications/stream`), the controller:
1. Extracts `sub` and `role` from the JWT
2. Registers both in `SseEmitterRegistry`

This allows Kafka listeners to broadcast to all connected STUDENT or ADMIN users by role without needing to know who is online — the registry handles it.

### Dual-write pattern

Every notification creation does two things in sequence:
1. Persist to PostgreSQL (source of truth)
2. Push to SSE registry (best-effort)

If the user is offline, the notification is in the DB and fetched on next login via `GET /api/notifications`.

---

## Local URLs

| Endpoint | URL |
|----------|-----|
| SSE stream | `http://localhost:8085/api/notifications/stream` |
| Notification history | `http://localhost:8085/api/notifications` |
| Unread count | `http://localhost:8085/api/notifications/unread-count` |
| Health check | `http://localhost:8085/actuator/health` |
| Via API Gateway | `http://localhost:8080/api/notifications/...` |

---

## Keycloak Dependency

The notification-service validates JWTs against the Keycloak `perapulse` realm:

- **Issuer:** `http://localhost:8080/auth/realms/perapulse` (browser-facing)
- **JWKS:** `http://keycloak:8080/auth/realms/perapulse/protocol/openid-connect/certs` (internal container)

Same split as `user-service` — avoids hostname mismatch between browser and containers.

---

## How to Run (Local Dev)

### Full Docker Compose stack

```powershell
cd infra
docker compose up postgres keycloak redpanda redpanda-console notification-service
```

### Compile only (without containers)

```powershell
cd services/notification-service

# Java 17 is system JAVA_HOME — set Java 21 inline for this project
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
.\mvnw.cmd compile
```

Compile result: **BUILD SUCCESS — 12 source files compiled**.

---

## Issues Encountered

### 1. `pom.xml` missing critical dependencies

The scaffold `pom.xml` had H2, JPA, and Lombok but was missing:
- `spring-boot-starter-security`
- `spring-boot-starter-oauth2-resource-server`
- `spring-kafka`
- `org.postgresql:postgresql`

All were added. H2 retained in test scope only.

### 2. Java 21 / JAVA_HOME conflict

System `JAVA_HOME` was set to `C:\Program Files\Java\jdk-17` (for other projects).
Maven wrapper picked up the wrong JDK.

**Fix:** Set `JAVA_HOME` inline per terminal session only:
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
```
This avoids touching system environment variables.

---

## Files Changed / Created

### New in `services/notification-service`

```
pom.xml                                          ← updated
src/main/resources/application.yaml             ← updated
src/main/java/com/perapulse/notification_service/
  config/SecurityConfig.java                    ← new
  config/SseKeepAliveScheduler.java              ← new
  dto/NotificationResponse.java                  ← new
  dto/PagedNotificationsResponse.java            ← new
  kafka/NotificationEventListener.java           ← new
  kafka/PlatformEvent.java                       ← new
  model/Notification.java                        ← new
  repository/NotificationRepository.java         ← new
  service/NotificationService.java               ← new
  sse/SseEmitterRegistry.java                    ← new
  web/NotificationController.java                ← new
```

### Modified in `services/api-gateway`

```
src/main/java/com/perapulse/api_gateway/config/
  GatewayRoutesConfig.java    ← added /api/notifications/** route
```

---

## React Web Client Integration (Next Steps)

When the React app is ready, the SSE stream should be connected on login using `@microsoft/fetch-event-source` (supports `Authorization` headers, unlike native `EventSource`):

```javascript
import { fetchEventSource } from '@microsoft/fetch-event-source';

fetchEventSource('/api/notifications/stream', {
  headers: { 'Authorization': `Bearer ${accessToken}` },
  onmessage(event) {
    if (event.event === 'notification') {
      const notif = JSON.parse(event.data);
      // increment badge, add to list
    }
  },
  onerror(err) { /* retry/reconnect */ }
});
```

---

## Remaining Work

- Integrate SSE stream into React app shell (bell icon + badge)
- Create Kafka topics in Docker Compose via an init container or startup script
- Dead-letter handling for malformed Kafka events
- Redis-backed `SseEmitterRegistry` for horizontal scaling
- End-to-end integration test with real producer services
