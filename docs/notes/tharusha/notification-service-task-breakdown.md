# Notification Service — Task Breakdown

> **Owner:** Tharusha  
> **User Stories:** US-07, US-10 (notification side), US-18 (admin notification side)  
> **Sprint scope:** Week 1 Day 6–7

---

## User Stories Covered

| ID | Story |
|----|-------|
| **US-07** | As a student, I can view my in-app notifications so I know about new events and opportunities. |
| **US-10** | As a student, I can request an upgrade to Alumni role and receive a notification once an admin reviews my request. |
| **US-18** | Admins receive a notification when a new alumni role request is submitted. |

---

## Scope

### In Scope

- `notification-service` microservice (Spring Boot 3.x / Java 21)
- Kafka consumer for all 4 domain topics (`perapulse.feed.events`, `perapulse.opportunities.events`, `perapulse.platform.events`, `perapulse.user.events`)
- PostgreSQL persistence (`notification_db`)
- Server-Sent Events (SSE) for real-time push to the web client
- In-memory SSE emitter registry with role-targeted broadcast support
- 4 REST endpoints (history, unread count, mark-read, mark-all-read)
- JWT/Keycloak security (same model as `user-service`)
- API Gateway route registration for `/api/notifications/**`

### Out of Scope

- Push notifications to mobile (Flutter integration — deferred)
- Firebase Cloud Messaging (FCM) / Web Push API
- Email or SMS notifications
- WebSocket-based delivery
- Per-notification deep links / routing actions
- Notification preferences / mute settings

---

## Architectural Decisions Made

### 1. SSE over Polling

**Decision:** Use Server-Sent Events (SSE) rather than client polling.

**Rationale:**
- Polling wastes server resources (95% of requests return nothing new)
- SSE is a one-way HTTP stream — simple to implement with Spring MVC `SseEmitter`
- React's `@microsoft/fetch-event-source` supports full-header SSE (including `Authorization`)
- No WebSocket complexity (stateful connections, STOMP broker, scaling concerns)

### 2. Broadcast Notifications via Marker `user_sub` Values

**Decision:** For events that target all users/students/admins (e.g., `EventCreated`, `OpportunityPosted`, `RoleRequestSubmitted`), store one DB row with a special `user_sub` marker value rather than duplicating rows per user.

**Markers used:**

| Marker | Audience |
|--------|----------|
| `ALL_USERS` | Everyone (any role) |
| `ALL_STUDENTS` | Users with `STUDENT` role |
| `ALL_ADMINS` | Users with `ADMIN` role |

**Rationale:**
- Avoids expensive fan-out writes (would need user-service to enumerate all subs)
- Keeps notification-service fully decoupled (no REST calls to user-service)
- REST queries and SSE broadcasts both filter by role at query/push time

### 3. Role Extraction from JWT

**Decision:** Extract the user's role directly from the Keycloak JWT (`realm_access.roles` claim) in the controller. Priority: `ADMIN > ALUMNI > STUDENT`.

**Rationale:**
- Consistent with how `user-service` extracts identity from JWT
- No extra DB lookup needed

### 4. Self-Action Guard for Feed Events

**Decision:** Don't notify a user when they like or comment on their own post.

**Implementation:** Check `authorSub != likerSub` / `authorSub != commenterSub` in the Kafka listener before creating the notification.

### 5. Dual-Write Pattern

**Decision:** On every Kafka event, first persist to DB, then push to SSE registry. DB is always the source of truth; SSE is best-effort delivery.

**Rationale:** If the user is offline (no SSE connection), the notification sits in the DB and is fetched via REST on next session.

---

## Task Breakdown

### 1. Dependencies and Configuration

- Update `pom.xml`: add `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`, `spring-kafka`, `postgresql` driver
- Write `application.yaml`: port 8085, `notification_db` datasource, Kafka consumer group `notification-service-cg`, Keycloak JWT config, actuator

### 2. Domain Layer

- Create `Notification` JPA entity (UUID PK, `userSub`, `type`, `title`, `body`, `read`, `createdAt`)
- Create `NotificationRepository` with JPQL queries for paginated fetch, unread count, mark-as-read (scoped to sub list)

### 3. SSE Infrastructure

- Create `SseEmitterRegistry`: `ConcurrentHashMap<String, SseEmitter>`, supports `send()`, `broadcastToAll()`, `broadcastToRole()`, keep-alive
- Create `SseKeepAliveScheduler`: `@Scheduled` every 25s to prevent proxy timeouts

### 4. Kafka Integration

- Create `PlatformEvent` DTO (generic event envelope with `Map<String, Object> data`)
- Create `NotificationEventListener` with `@KafkaListener` per topic:
  - `perapulse.feed.events` → `PostLiked`, `CommentAdded`
  - `perapulse.opportunities.events` → `OpportunityPosted`, `ApplicationSubmitted`, `ApplicationStatusUpdated`
  - `perapulse.platform.events` → `EventCreated`
  - `perapulse.user.events` → `RoleRequestSubmitted`, `RoleRequestApproved`, `RoleRequestRejected`

### 5. Service and API Layer

- Create `NotificationService`: dual DB+SSE write, role-aware `buildSubList()`, broadcast methods
- Create `NotificationResponse` and `PagedNotificationsResponse` DTOs
- Create `NotificationController`: SSE stream endpoint + 4 REST endpoints

### 6. Security

- Create `SecurityConfig`: mirrors `user-service` pattern, CSRF off, all `/api/notifications/**` require JWT

### 7. Gateway Integration

- Add `/api/notifications/**` route to `api-gateway` `GatewayRoutesConfig`

---

## Files Changed

### New Files — `services/notification-service/src/main/java/`

```
com/perapulse/notification_service/
  config/
    SecurityConfig.java
    SseKeepAliveScheduler.java
  dto/
    NotificationResponse.java
    PagedNotificationsResponse.java
  kafka/
    NotificationEventListener.java
    PlatformEvent.java
  model/
    Notification.java
  repository/
    NotificationRepository.java
  service/
    NotificationService.java
  sse/
    SseEmitterRegistry.java
  web/
    NotificationController.java
```

### Modified Files

| File | Change |
|------|--------|
| `services/notification-service/pom.xml` | Added Spring Security, Kafka, OAuth2, PostgreSQL deps |
| `services/notification-service/src/main/resources/application.yaml` | Full config (port, DB, Kafka, security, actuator) |
| `services/api-gateway/.../GatewayRoutesConfig.java` | Added `/api/notifications/**` → notification-service route |

---

## Acceptance Criteria

- [ ] Notification is pushed via SSE within 1–2 seconds of a Kafka event
- [ ] REST `GET /api/notifications` returns paginated list including broadcast notifications for the user's role
- [ ] `GET /api/notifications/unread-count` returns correct count
- [ ] `POST /api/notifications/{id}/read` marks the notification as read
- [ ] `POST /api/notifications/read-all` marks all as read
- [ ] Unauthenticated requests return `401`
- [ ] Self-action notifications (liked own post) are not created
- [ ] `mvn compile` succeeds with no errors

---

## Dependencies

- Redpanda running and 4 topics created
- `notification_db` PostgreSQL database created (handled by `infra/postgres/init.sql`)
- Keycloak `perapulse` realm running with valid test users
- Producer services publishing Kafka events in the standard envelope format

---

## Risks / Watch Items

- SSE connections drop if a proxy (nginx, load balancer) idles out before the 25s keep-alive
- The `SseEmitterRegistry` is in-memory — horizontal scaling of notification-service requires Redis pub/sub (future work)
- `ALL_STUDENTS` broadcast relies on correct role in JWT; ALUMNI users will not receive student-targeted notifications
- Kafka deserialization errors are caught and logged but not dead-lettered (future improvement)

---

## Remaining Follow-up Work

- Add dead-letter topic for failed Kafka message deserialization
- Add Redis-backed emitter registry for horizontal scaling
- Integrate SSE stream into the React web client using `@microsoft/fetch-event-source`
- Add notification bell icon + unread badge to the React app shell
- Consider WebSocket upgrade if real-time requirements grow beyond SSE
