# PeraPulse — High-level System & API Breakdown (Mini Project)

> Target: 2-week MVP focusing on **architecture + integration** (not full feature completeness).  
> Tech: **Spring Boot + React + Docker + AKS + PostgreSQL + Keycloak + Kafka API (Dev: Redpanda, Prod: Azure Event Hubs Kafka endpoint)**.

---

## 1. System overview

**Goal:** A department engagement platform for **students + alumni** with:
- Social feed (posts, comments, likes)
- Jobs/Internships + applications
- Events + RSVP
- Research collaboration (lightweight)
- Messaging (optional / stub)
- Notifications + simple analytics (optional but good for “integration” marks)

### Clients
- **Web client (React)**: primary UI
- **Mobile client (minimal)**: consume same APIs (e.g., React Native / Flutter).  
  MVP: login + view feed + view jobs/events + apply/RSVP.

---

## 2. High-level architecture (microservices)

**Edge**
- **Ingress (NGINX Ingress Controller)** on AKS
- Optional: **API Gateway service** (Spring Cloud Gateway) for routing + unified API surface

**Core Services**
1. **User/Profile Service** (service-owned DB)
2. **Feed Service** (posts, comments, likes)
3. **Opportunities Service** (jobs/internships + applications)
4. **Events Service** (events + RSVPs)
5. **Notifications Service** (event-driven, in-app notifications)
6. **Analytics Service** (event-driven counters / basic dashboard)

**Optional / Stretch**
7. **Research Service** (project listings + join requests)
8. **Messaging Service** (basic DM) — can be stubbed

**Asynchronous Integration**
- **Dev**: Redpanda (Kafka-compatible)
- **AKS/Cloud**: Azure **Event Hubs (Kafka interface)**

**Storage**
- Each service owns its **PostgreSQL schema/database** (recommended: separate DB per service if feasible)
- Optional file/media: **Azure Blob Storage** (store URLs in DB)

---

## 3. Authentication & Authorization (Keycloak)

### Keycloak components
- **Realm**: `perapulse`
- **Clients**:
  - `web-client` (public)
  - `mobile-client` (public)
  - `api-gateway` (confidential) *optional*
  - `perapulse-web-test` (public, local temporary PKCE test page)
- **Roles** (realm roles):
  - `STUDENT`, `ALUMNI`, `ADMIN`

### Auth flow
- Web/Mobile uses **OIDC Authorization Code + PKCE**
- API Gateway validates JWT (Keycloak public keys / JWKS)
- Downstream resource services also validate JWT
- Authorization:
  - `ADMIN` can moderate + manage platform
  - `ALUMNI` can post jobs, events, research offers (policy choice)
  - `STUDENT` can apply, RSVP, post, comment

> Tip: Keep authorization checks mostly in services (Spring Security), with optional route-level checks at Gateway.

### Current local auth slice
- Browser auth flow runs through `http://localhost:8080/auth`
- Direct Keycloak admin access is exposed on `http://localhost:8180/auth/admin`
- Temporary auth test UI is served from `api-gateway` at `http://localhost:8080/`
- Initial protected endpoint: `GET /api/users/info`

---

## 4. Service boundaries (what each owns)

### 4.1 User/Profile Service
**Owns:** user profile metadata (not credentials; Keycloak is source of truth for identity)

Data (examples)
- `user_profile { id, keycloak_sub, role, name, email, grad_year, bio, linkedin_url, created_at }`

---

### 4.2 Feed Service
**Owns:** posts, comments, likes

Data (examples)
- `post { id, author_sub, content, media_url?, created_at }`
- `comment { id, post_id, author_sub, text, created_at }`
- `like { post_id, user_sub, created_at }`

---

### 4.3 Opportunities Service
**Owns:** jobs/internships + applications

Data (examples)
- `opportunity { id, created_by_sub, type, title, company, description, deadline?, created_at }`
- `application { id, opportunity_id, applicant_sub, status, resume_url?, created_at }`

---

### 4.4 Events Service
**Owns:** events + RSVPs

Data (examples)
- `event { id, created_by_sub, title, description, start_time, location, created_at }`
- `rsvp { event_id, user_sub, status, created_at }`

---

### 4.5 Notifications Service (event-driven)
**Owns:** in-app notifications

Data (examples)
- `notification { id, user_sub, type, title, body, read, created_at }`

Consumes events from Kafka topic(s) and creates notifications.

---

### 4.6 Analytics Service (event-driven)
**Owns:** basic aggregated stats for dashboard

Data (examples)
- `daily_stats { date, new_posts, likes, applications, rsvps }`
- `leaderboard_cache { key, value_json, updated_at }`

---

## 5. API surface (high-level, non-exhaustive)

### Common API conventions
- Base path: `/api`
- Auth: `Authorization: Bearer <JWT>`
- Correlation: `X-Correlation-Id` (optional but nice)
- Pagination: `?page=0&size=20` (or cursor-based later)

---

## 5.1 User/Profile Service APIs

#### Profile
- `GET  /api/profiles/me`
- `PUT  /api/profiles/me`
- `GET  /api/profiles/{userSub}` (public/limited fields)

#### Admin (optional)
- `GET  /api/admin/users?role=ALUMNI`

---

## 5.2 Feed Service APIs

#### Posts
- `POST /api/posts`
- `GET  /api/posts` (feed)
- `GET  /api/posts/{postId}`
- `DELETE /api/posts/{postId}` (owner/admin)

#### Comments
- `POST /api/posts/{postId}/comments`
- `GET  /api/posts/{postId}/comments`

#### Likes
- `POST   /api/posts/{postId}/likes`
- `DELETE /api/posts/{postId}/likes`

---

## 5.3 Opportunities Service APIs

#### Opportunities
- `POST /api/opportunities` (ALUMNI/ADMIN)
- `GET  /api/opportunities`
- `GET  /api/opportunities/{id}`

#### Applications
- `POST /api/opportunities/{id}/apply` (STUDENT)
- `GET  /api/opportunities/{id}/applications` (creator/admin)
- `GET  /api/applications/me` (STUDENT)

---

## 5.4 Events Service APIs

#### Events
- `POST /api/events` (ALUMNI/ADMIN)
- `GET  /api/events`
- `GET  /api/events/{id}`

#### RSVP
- `POST /api/events/{id}/rsvp`  body: `{ "status": "GOING|NOT_GOING|MAYBE" }`
- `GET  /api/events/{id}/attendees` (optional)

---

## 5.5 Notifications Service APIs

- `GET  /api/notifications` (my notifications)
- `POST /api/notifications/{id}/read`

---

## 5.6 Analytics Service APIs

- `GET /api/analytics/summary`  
  Example: `{ totalUsers, totalPosts, totalOpportunities, totalApplications, upcomingEvents }`
- `GET /api/analytics/top-posts?limit=5`

---

## 6. Event-driven integration (Kafka)

### Topics (keep it minimal)
- `platform.events`  (single topic is enough for the mini project)

### Event envelope (recommended)
```json
{
  "eventId": "uuid",
  "eventType": "EventCreated | OpportunityPosted | ApplicationSubmitted | PostCreated | PostLiked | RSVPUpdated",
  "timestamp": "ISO-8601",
  "producer": "events-service",
  "data": { }
}
```

### Producers (MVP)
- `events-service` -> `EventCreated`, `RSVPUpdated`
- `opportunities-service` -> `OpportunityPosted`, `ApplicationSubmitted`
- `feed-service` -> `PostCreated`, `PostLiked`

### Consumers (MVP)
- `notification-service`
  - On `EventCreated`: notify all users (or students)
  - On `OpportunityPosted`: notify students
  - On `ApplicationSubmitted`: notify job poster
- `analytics-service`
  - Increment counters per event type (daily stats)

---

## 7. Deployment (AKS) — high-level

### AKS resources
- Namespace: `peraconnect`
- Deployments:
  - `gateway` (optional)
  - each microservice deployment + ClusterIP service
  - `keycloak` (or use managed Keycloak if available)
- Data:
  - Azure Database for PostgreSQL (recommended managed)
- Messaging:
  - Azure Event Hubs (Kafka endpoint) — **cloud**
- Ingress:
  - NGINX Ingress routes `/api/*` to gateway/services and `/` to React UI

### Config & secrets
- Use **Kubernetes Secrets** (or **Azure Key Vault + CSI driver** if you want extra marks)
- Store:
  - DB URLs/credentials
  - Event Hubs connection settings (SASL)
  - Keycloak issuer + client IDs

---

## 8. “2-week MVP” feature set suggestion

**Must implement**
- Keycloak login (web + minimal mobile)
- Feed: create + list + like + comment
- Jobs: create + list + apply
- Events: create + list + RSVP
- At least **1 Kafka flow**: `EventCreated` -> notification + analytics

**Nice to have**
- Admin moderation endpoint (delete post/job)
- Blob storage for resumes/images (store URLs)
- Simple analytics dashboard page in React

---

## 9. API ownership summary (quick view)

- **Gateway**: routing only (optional auth policy)
- **User Service**: `/profiles/*`
- **Feed Service**: `/posts/*`
- **Opportunities**: `/opportunities/*`, `/applications/*`
- **Events**: `/events/*`
- **Notifications**: `/notifications/*`
- **Analytics**: `/analytics/*`

---

*End of file.*
