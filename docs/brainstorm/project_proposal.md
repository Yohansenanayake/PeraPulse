# PeraPulse — Project Proposal & MVP Breakdown
### CO528 Applied Software Architecture — Mini Project (2-Week Sprint)

> **Prepared by:** Solution Architect  
> **Date:** March 2026  
> **Revision:** v1.1 (Updated after brainstorm — decisions 1, 3, 8, 9, 10 locked)

---

## 1. Executive Summary

**PeraPulse** is a Department Engagement & Career Platform (DECP) for the Department of Computer Engineering, University of Peradeniya. It connects current students and alumni through a social feed, job/internship listings, department events, and lightweight research collaboration — all secured via Keycloak OIDC and delivered via Web + Mobile clients.

The 2-week sprint will focus on **architecture correctness, service integration, and core feature delivery** rather than feature completeness. This aligns squarely with the evaluation rubric which weights SOA correctness, inter-service communication, cloud deployment, and documentation.

---

## 2. Assigned Roles

| Role | Responsibility Area |
|---|---|
| **Enterprise Architect** | High-level module integration, user roles, departmental workflow diagrams |
| **Solution Architect** | End-to-end system design, tech stack selection, deployment blueprint |
| **Application Architect** | Service-level design, API contracts, data models, service interaction patterns |
| **Security Architect** | Keycloak realm setup, OIDC/JWT flow, role-based authorization, secret management |
| **DevOps Architect** | Docker, AKS cluster setup, CI/CD pipeline, Ingress, key vault integration |

---

## 3. MVP User Stories

### Role: Student

| ID | User Story | Priority |
|---|---|---|
| US-01 | As a student, I can register and log in using my university credentials so I can access the platform securely. | **Must** |
| US-02 | As a student, I can create and view posts in the social feed so I can share updates with the department. | **Must** |
| US-03 | As a student, I can like and comment on posts to engage with community content. | **Must** |
| US-04 | As a student, I can browse available jobs and internships so I can find career opportunities. | **Must** |
| US-05 | As a student, I can apply for a job/internship listing so I can submit my interest. | **Must** |
| US-06 | As a student, I can view upcoming department events and RSVP so I can plan my attendance. | **Must** |
| US-07 | As a student, I can view my in-app notifications so I know about new events and opportunities. | **Must** |
| US-08 | As a student, I can edit my profile (bio, LinkedIn, graduation year) so others know who I am. | **Must** |
| US-09 | As a student, I can view open research collaboration projects posted by alumni/faculty. | **Should** |
| US-10 | As a student, I can request an upgrade to Alumni role by submitting my graduation details, and receive a notification once an admin reviews my request. | **Must** |

### Role: Alumni

| ID | User Story | Priority |
|---|---|---|
| US-10 | As an alumni, I can register and log in, and my profile reflects my alumni status. | **Must** |
| US-11 | As an alumni, I can post job/internship listings to the opportunities feed. | **Must** |
| US-12 | As an alumni, I can create department events and view RSVPs from students. | **Must** |
| US-13 | As an alumni, I can post research collaboration opportunities for students. | **Should** |
| US-14 | As an alumni, I can view applications submitted to my job listings. | **Must** |

### Role: Admin

| ID | User Story | Priority |
|---|---|---|
| US-15 | As an admin, I can delete inappropriate posts or close job listings. | **Should** |
| US-16 | As an admin, I can view a simple analytics dashboard (active users, posts, applications). | **Should** |
| US-17 | As an admin, I can list all users and filter by role. | **Should** |
| US-18 | As an admin, I can view pending Alumni role requests and approve or reject them so the user's Keycloak role is updated. | **Must** |

### Mobile Client (Minimal MVP)

| ID | User Story | Priority |
|---|---|---|
| US-19 | As a mobile user, I can log in and view the social feed. | **Must** |
| US-20 | As a mobile user, I can browse and view job/internship listings. | **Must** |
| US-21 | As a mobile user, I can view upcoming events and RSVP. | **Must** |

---

## 4. Architecture Overview

### 4.1 Architectural Patterns Applied

| Pattern | How Applied |
|---|---|
| **SOA / Microservices** | Each domain (Feed, Opportunities, Events, etc.) is a dedicated Spring Boot service with its own DB |
| **Web-Oriented Architecture** | React SPA consumes REST APIs; same APIs consumed by mobile |
| **Event-Driven Architecture** | Kafka (Redpanda dev, Azure Event Hubs prod) decouples producers from Notification & Analytics consumers |
| **API Gateway Pattern** | Spring Cloud Gateway as single entry point; handles routing + optional JWT validation |
| **CQRS-lite** | Analytics service maintains pre-aggregated read models from Kafka events |
| **Database per Service** | Each microservice owns a dedicated PostgreSQL schema |

### 4.2 High-Level Architecture Diagram (Textual)

```
┌─────────────────────────────────────────────────────────┐
│                        Clients                          │
│         React SPA (Web)  │  React Native (Mobile)       │
└──────────────┬───────────┴──────────────┬───────────────┘
               │  HTTPS                   │  HTTPS
┌──────────────▼──────────────────────────▼───────────────┐
│              NGINX Ingress Controller (AKS)              │
│   /auth → Keycloak   /api → API Gateway   / → React UI  │
└──────────────────────────┬──────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │  API Gateway            │
              │  (Spring Cloud Gateway) │
              └──┬────┬────┬────┬────┬──┘
                 │    │    │    │    │
       ┌─────────┘  ┌─┘  ┌─┘  ┌─┘  └────────┐
       ▼            ▼    ▼    ▼               ▼
 ┌──────────┐ ┌──────┐ ┌──────┐ ┌─────────┐ ┌──────────────┐
 │ User/    │ │ Feed │ │ Opp. │ │ Events  │ │ Notif. /     │
 │ Profile  │ │ Svc  │ │ Svc  │ │ Service │ │ Analytics Svc│
 │ Service  │ │      │ │      │ │         │ │              │
 └────┬─────┘ └──┬───┘ └──┬───┘ └────┬────┘ └──────┬───────┘
      │          │        │          │              │
   ┌──▼──┐    ┌──▼──┐  ┌──▼──┐   ┌──▼──┐         │
   │ DB  │    │ DB  │  │ DB  │   │ DB  │         │
   └─────┘    └─────┘  └─────┘   └─────┘         │
                                                  │
         ┌────────────────────────────────────────┘
         │        Kafka (Redpanda / Azure Event Hubs)
          │   Topics: perapulse.feed.events
          │            perapulse.opportunities.events
          │            perapulse.platform.events
          │            perapulse.user.events
         │
   ┌─────┴──────────────────────────────┐
   │  Producers: Feed, Opp., Events Svc │
   │  Consumers: Notification, Analytics│
   └────────────────────────────────────┘

              ┌──────────────────────┐
              │  Keycloak (OIDC IdP) │
              │  Realm: perapulse    │
              └──────────────────────┘
```

---

## 5. Tech Stack

### Backend
| Component | Technology | Justification |
|---|---|---|
| Services | **Spring Boot 3.x** (Java 21) | Industry standard, robust ecosystem, Spring Security for JWT |
| Service Mesh Comms | **REST (OpenFeign)** for sync calls | Simple, well-understood for 2-week scope |
| API Gateway | **Spring Cloud Gateway** | Native Spring, easy route config, filter support |
| Auth/Identity | **Keycloak 24.x** | Production-grade OIDC, roles, minimal custom code |
| Messaging | **Redpanda** (dev) → **Azure Event Hubs** (prod, Kafka API) | Kafka-compatible in both environments |
| Database | **PostgreSQL 16** | Reliable, consistent, one instance per service |
| ORM | **Spring Data JPA / Hibernate** | Standard, reduces boilerplate |

### Frontend
| Component | Technology | Justification |
|---|---|---|
| Web Client | **React 18 + Vite** | Fast dev, component reuse, wide adoption |
| State Mgmt | **Zustand** (lightweight) | Simpler than Redux for mini project scope |
| HTTP Client | **Axios** + React Query | Caching, loading states, pagination support |
| Auth (Web) | **Keycloak JS Adapter** / OIDC PKCE | Standard integration |
| UI Kit | **Tailwind CSS + shadcn/ui** | Rapid, professional UI |

### Mobile
| Component | Technology | Justification |
|---|---|---|
| Mobile Client | **React Native (Expo)** | JS reuse from web, fast prototyping |
| Auth (Mobile) | **Expo AuthSession** + Keycloak PKCE | Same Keycloak realm, no extra backend |

### Infrastructure & DevOps
| Component | Technology |
|---|---|
| Containerisation | **Docker** (multi-stage builds) |
| Orchestration | **Azure Kubernetes Service (AKS)** |
| Ingress | **NGINX Ingress Controller** |
| Container Registry | **Azure Container Registry (ACR)** |
| Managed DB | **Azure Database for PostgreSQL** (Flexible Server) |
| Async Messaging | **Azure Event Hubs** (Kafka endpoint) |
| File/Media Storage | **Azure Blob Storage** |
| Secrets | **Kubernetes Secrets** (or Azure Key Vault CSI driver) |
| CI/CD | **GitHub Actions** → build → push to ACR → deploy to AKS |
| Local Dev | **Docker Compose** (all services + Redpanda + Keycloak + Postgres) |

---

## 6. Microservice Breakdown

### 6.1 Service Inventory

| Service | Port (local) | Owns | DB Schema |
|---|---|---|---|
| `user-service` | 8081 | User profiles, role metadata | `user_db` |
| `feed-service` | 8082 | Posts, comments, likes | `feed_db` |
| `opportunities-service` | 8083 | Jobs, internships, applications | `opportunities_db` |
| `events-service` | 8084 | Events, RSVPs | `events_db` |
| `notification-service` | 8085 | In-app notifications | `notification_db` |
| `analytics-service` | 8086 | Aggregated stats, dashboard | `analytics_db` |
| `api-gateway` | 8080 | Routing, JWT forwarding | — |
| `research-service` *(stretch)* | 8087 | Research projects, join requests | `research_db` |

### 6.2 Inter-Service Communication

| Pattern | Used For |
|---|---|
| **Synchronous REST** | Gateway → Services; Feed Service → User Service (profile enrichment) |
| **Kafka (async)** | Feed/Opp/Events → Notification Service; Feed/Opp/Events → Analytics |

---

## 7. Detailed Service API Contracts

### Common Conventions
- **Base URL:** `https://<host>/api`
- **Auth:** `Authorization: Bearer <JWT>` (Keycloak-issued)
- **Headers:** `X-Correlation-Id: <uuid>` (for tracing)
- **Pagination:** `?page=0&size=20`
- **Content-Type:** `application/json`
- **Error format:**
```json
{
  "timestamp": "2026-03-06T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "field 'title' must not be blank",
  "path": "/api/events"
}
```

---

### 7.1 User/Profile Service (`user-service`)

#### Data Model
```sql
user_profile (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keycloak_sub  VARCHAR(255) UNIQUE NOT NULL,
  role          VARCHAR(50) NOT NULL,  -- STUDENT | ALUMNI | ADMIN
  display_name  VARCHAR(255),
  email         VARCHAR(255),
  department    VARCHAR(255),
  grad_year     INT,
  bio           TEXT,
  linkedin_url  VARCHAR(500),
  avatar_url    VARCHAR(500),
  created_at    TIMESTAMP DEFAULT now(),
  updated_at    TIMESTAMP DEFAULT now()
)
)

role_request (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sub        VARCHAR(255) NOT NULL,
  requested_role  VARCHAR(50) NOT NULL DEFAULT 'ALUMNI',
  graduation_year INT,
  evidence_text   TEXT,
  status          VARCHAR(50) DEFAULT 'PENDING',  -- PENDING | APPROVED | REJECTED
  reviewed_by_sub VARCHAR(255),
  created_at      TIMESTAMP DEFAULT now(),
  updated_at      TIMESTAMP DEFAULT now()
)
```

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profiles/me` | Any role | Get my profile (created on first login) |
| `PUT` | `/api/profiles/me` | Any role | Update my profile |
| `GET` | `/api/profiles/{sub}` | Any role | Get any user's public profile |
| `GET` | `/api/admin/users` | ADMIN | List users; `?role=ALUMNI` filter |
| `GET` | `/api/admin/users/{sub}` | ADMIN | Get user details |
| `POST` | `/api/profiles/role-requests` | STUDENT | Submit an alumni role request |
| `GET` | `/api/admin/role-requests` | ADMIN | List role requests; `?status=PENDING` |
| `PUT` | `/api/admin/role-requests/{id}/approve` | ADMIN | Approve request → assign `ALUMNI` role in Keycloak |
| `PUT` | `/api/admin/role-requests/{id}/reject` | ADMIN | Reject request → notify user |

**POST Sync:** On first `GET /api/profiles/me`, if no profile exists, auto-create one from JWT claims.

**Alumni Role Promotion — Phased Implementation:**
- **Phase 1 (Week 1):** Approve endpoint updates DB status only; admin assigns `ALUMNI` role manually in Keycloak UI.
- **Phase 2 (Week 2, stretch):** Approve endpoint calls Keycloak Admin REST API using a `user-service` service-account client (grant type: `client_credentials`) with `manage-users` permission.

> ⚠️ After approval, the user must refresh their session (log out + log in) for the new JWT with `ALUMNI` role to be issued by Keycloak.

---

### 7.2 Feed Service (`feed-service`)

#### Data Model
```sql
post (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_sub  VARCHAR(255) NOT NULL,
  content     TEXT NOT NULL,
  media_url   VARCHAR(500),
  created_at  TIMESTAMP DEFAULT now()
)

comment (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES post(id) ON DELETE CASCADE,
  author_sub  VARCHAR(255) NOT NULL,
  text        TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT now()
)

post_like (
  post_id     UUID REFERENCES post(id) ON DELETE CASCADE,
  user_sub    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT now(),
  PRIMARY KEY (post_id, user_sub)
)
```

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/posts` | Any role | Create a post |
| `GET` | `/api/posts` | Any role | Get feed (paginated, sorted by `created_at` desc) |
| `GET` | `/api/posts/{postId}` | Any role | Get a single post |
| `DELETE` | `/api/posts/{postId}` | Owner / ADMIN | Delete a post |
| `POST` | `/api/posts/{postId}/comments` | Any role | Add a comment |
| `GET` | `/api/posts/{postId}/comments` | Any role | Get comments for a post |
| `POST` | `/api/posts/{postId}/likes` | Any role | Like a post |
| `DELETE` | `/api/posts/{postId}/likes` | Any role | Unlike a post |

**Kafka Publish** → topic `perapulse.feed.events`: `PostCreated`, `PostLiked`, `CommentAdded`.

---

### 7.3 Opportunities Service (`opportunities-service`)

#### Data Model
```sql
opportunity (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_sub  VARCHAR(255) NOT NULL,
  type            VARCHAR(50) NOT NULL,  -- JOB | INTERNSHIP
  title           VARCHAR(500) NOT NULL,
  company         VARCHAR(255) NOT NULL,
  description     TEXT,
  location        VARCHAR(255),
  deadline        DATE,
  status          VARCHAR(50) DEFAULT 'OPEN',  -- OPEN | CLOSED
  created_at      TIMESTAMP DEFAULT now()
)

application (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  UUID REFERENCES opportunity(id),
  applicant_sub   VARCHAR(255) NOT NULL,
  cover_letter    TEXT,
  resume_url      VARCHAR(500),
  status          VARCHAR(50) DEFAULT 'PENDING',  -- PENDING | REVIEWED | ACCEPTED | REJECTED
  created_at      TIMESTAMP DEFAULT now(),
  UNIQUE (opportunity_id, applicant_sub)
)
```

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/opportunities` | ALUMNI / ADMIN | Create a listing |
| `GET` | `/api/opportunities` | Any role | List opportunities; `?type=JOB&status=OPEN` |
| `GET` | `/api/opportunities/{id}` | Any role | Get a single opportunity |
| `PUT` | `/api/opportunities/{id}` | Owner / ADMIN | Update listing |
| `DELETE` | `/api/opportunities/{id}` | Owner / ADMIN | Delete listing |
| `POST` | `/api/opportunities/{id}/apply` | STUDENT | Submit an application |
| `GET` | `/api/opportunities/{id}/applications` | Owner / ADMIN | Get applications for a listing |
| `GET` | `/api/applications/me` | STUDENT | Get my submitted applications |
| `PUT` | `/api/applications/{appId}/status` | Owner / ADMIN | Update application status |

**Kafka Publish** → topic `perapulse.opportunities.events`: `OpportunityPosted`, `ApplicationSubmitted`, `ApplicationStatusUpdated`.

---

### 7.4 Events Service (`events-service`)

#### Data Model
```sql
event (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_sub  VARCHAR(255) NOT NULL,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  venue           VARCHAR(500),
  start_time      TIMESTAMP NOT NULL,
  end_time        TIMESTAMP,
  banner_url      VARCHAR(500),
  created_at      TIMESTAMP DEFAULT now()
)

rsvp (
  event_id    UUID REFERENCES event(id) ON DELETE CASCADE,
  user_sub    VARCHAR(255) NOT NULL,
  status      VARCHAR(50) NOT NULL,  -- GOING | NOT_GOING | MAYBE
  created_at  TIMESTAMP DEFAULT now(),
  PRIMARY KEY (event_id, user_sub)
)
```

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/events` | ALUMNI / ADMIN | Create an event |
| `GET` | `/api/events` | Any role | List events; `?upcoming=true` |
| `GET` | `/api/events/{id}` | Any role | Get event details |
| `PUT` | `/api/events/{id}` | Owner / ADMIN | Update event |
| `DELETE` | `/api/events/{id}` | Owner / ADMIN | Delete event |
| `POST` | `/api/events/{id}/rsvp` | Any role | RSVP for event |
| `GET` | `/api/events/{id}/attendees` | Owner / ADMIN | Get attendee list |
| `GET` | `/api/events/me/rsvps` | Any role | Get my RSVPs |

**Kafka Publish** → topic `perapulse.platform.events`: `EventCreated`, `RSVPUpdated`.

---

### 7.5 Notification Service (`notification-service`)

#### Data Model
```sql
notification (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sub    VARCHAR(255) NOT NULL,
  type        VARCHAR(100) NOT NULL,
  title       VARCHAR(500) NOT NULL,
  body        TEXT,
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT now()
)
```

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Any role | Get my notifications (paginated) |
| `GET` | `/api/notifications/unread-count` | Any role | Get count of unread notifications |
| `POST` | `/api/notifications/{id}/read` | Any role | Mark a notification as read |
| `POST` | `/api/notifications/read-all` | Any role | Mark all as read |

**Kafka Consume** (consumer group: `notification-service-cg`):

| Topic | Event | Action |
|---|---|---|
| `perapulse.feed.events` | `PostLiked` | Notify post author: *"{user} liked your post"* |
| `perapulse.feed.events` | `CommentAdded` | Notify post author: *"{user} commented on your post"* |
| `perapulse.opportunities.events` | `OpportunityPosted` | Notify all students: *"New opportunity: {title} at {company}"* |
| `perapulse.opportunities.events` | `ApplicationSubmitted` | Notify listing owner: *"New application for {title}"* |
| `perapulse.opportunities.events` | `ApplicationStatusUpdated` | Notify applicant: *"Your application status changed"* |
| `perapulse.platform.events` | `EventCreated` | Notify all users: *"New event: {title}"* |
| `perapulse.user.events` | `RoleRequestSubmitted` | Notify all admins: *"New alumni role request from {name}"* |
| `perapulse.user.events` | `RoleRequestApproved` | Notify user: *"Your alumni role request was approved. Please refresh your session."* |
| `perapulse.user.events` | `RoleRequestRejected` | Notify user: *"Your alumni role request was rejected."* |

---

### 7.6 Analytics Service (`analytics-service`)

#### Data Model
```sql
platform_stats (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date         DATE NOT NULL,
  new_posts         INT DEFAULT 0,
  new_likes         INT DEFAULT 0,
  new_applications  INT DEFAULT 0,
  new_rsvps         INT DEFAULT 0,
  new_events        INT DEFAULT 0,
  updated_at        TIMESTAMP DEFAULT now(),
  UNIQUE (stat_date)
)

aggregate_counter (
  key        VARCHAR(255) PRIMARY KEY,
  value      BIGINT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now()
)
-- keys: total_posts, total_opportunities, total_events, total_users, total_applications
```

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/summary` | ADMIN | Totals: users, posts, opportunities, events |
| `GET` | `/api/analytics/daily?from=2026-03-01&to=2026-03-07` | ADMIN | Daily stat breakdown |
| `GET` | `/api/analytics/top-posts?limit=5` | ADMIN | Top liked posts (via counter) |

**Kafka Consume** (consumer group: `analytics-service-cg`) — topics `perapulse.feed.events`, `perapulse.opportunities.events`, `perapulse.platform.events`:
- Each event increments the corresponding daily stat row and aggregate counter.

---

### 7.7 Research Service (`research-service`) — *Stretch Goal*

#### Endpoints (planned)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/research` | ALUMNI / ADMIN | Create a research project |
| `GET` | `/api/research` | Any role | List research projects |
| `GET` | `/api/research/{id}` | Any role | View project detail |
| `POST` | `/api/research/{id}/join` | STUDENT | Express interest / join |
| `GET` | `/api/research/{id}/members` | Owner / ADMIN | View members |

---

## 8. Kafka Event Contracts

### Topic Strategy

Topics follow domain service boundaries (4 topics for MVP):

| Topic | Producer | Consumers |
|---|---|---|
| `perapulse.feed.events` | `feed-service` | `notification-service`, `analytics-service` |
| `perapulse.opportunities.events` | `opportunities-service` | `notification-service`, `analytics-service` |
| `perapulse.platform.events` | `events-service` | `notification-service`, `analytics-service` |
| `perapulse.user.events` | `user-service` | `notification-service` |

- **Dev (Redpanda):** All 4 topics on local Redpanda instance
- **Prod (Azure Event Hubs):** All 4 topics via Kafka-compatible endpoint

### Consumer Groups

| Consumer Group | Subscribes To |
|---|---|
| `notification-service-cg` | All 4 topics |
| `analytics-service-cg` | `perapulse.feed.events`, `perapulse.opportunities.events`, `perapulse.platform.events` |

### Event Envelope (standard)
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "PostCreated",
  "timestamp": "2026-03-06T14:30:00Z",
  "producer": "feed-service",
  "topic": "perapulse.feed.events",
  "data": { }
}
```

### Event Payloads

**`perapulse.feed.events`**

| EventType | `data` Fields |
|---|---|
| `PostCreated` | `postId`, `authorSub`, `contentSnippet` |
| `PostLiked` | `postId`, `likerSub`, `authorSub` |
| `CommentAdded` | `postId`, `commentId`, `commenterSub`, `authorSub` |

**`perapulse.opportunities.events`**

| EventType | `data` Fields |
|---|---|
| `OpportunityPosted` | `opportunityId`, `title`, `company`, `type`, `createdBySub` |
| `ApplicationSubmitted` | `applicationId`, `opportunityId`, `applicantSub`, `listingOwnerSub` |
| `ApplicationStatusUpdated` | `applicationId`, `opportunityId`, `applicantSub`, `newStatus` |

**`perapulse.platform.events`**

| EventType | `data` Fields |
|---|---|
| `EventCreated` | `eventId`, `title`, `startTime`, `createdBySub` |
| `RSVPUpdated` | `eventId`, `userSub`, `status` |

**`perapulse.user.events`**

| EventType | `data` Fields |
|---|---|
| `RoleRequestSubmitted` | `requestId`, `userSub`, `displayName`, `requestedRole`, `graduationYear` |
| `RoleRequestApproved` | `requestId`, `userSub`, `approvedBySub` |
| `RoleRequestRejected` | `requestId`, `userSub`, `rejectedBySub` |

---

## 9. Authentication & Authorization

### Keycloak Configuration

| Setting | Value |
|---|---|
| Realm | `perapulse` |
| Hosting | Self-hosted on AKS (Keycloak 24.x Docker image) |
| Clients | `web-client` (public, PKCE), `mobile-client` (public, PKCE), `api-gateway` (confidential), `user-service` (confidential, service account for Admin API) |
| Realm Roles | `STUDENT`, `ALUMNI`, `ADMIN` |
| Default Role | `STUDENT` (assigned on registration) |
| Token Lifetime | Access: 5 min, Refresh: 30 min |

### Authorization Matrix

| Resource | STUDENT | ALUMNI | ADMIN |
|---|---|---|---|
| View feed, events, opportunities | ✅ | ✅ | ✅ |
| Create posts | ✅ | ✅ | ✅ |
| Apply for jobs | ✅ | ❌ | ✅ |
| Post jobs/internships | ❌ | ✅ | ✅ |
| Create events | ❌ | ✅ | ✅ |
| View all applications | ❌ | Own listings | ✅ |
| Delete any content | ❌ | ❌ | ✅ |
| View analytics | ❌ | ❌ | ✅ |
| Request Alumni role | ✅ | N/A | N/A |
| Approve/reject role requests | ❌ | ❌ | ✅ |

### JWT Validation Flow
1. Client obtains token from Keycloak via OIDC PKCE flow
2. Client sends `Authorization: Bearer <token>` with API requests
3. API Gateway / each service validates JWT against Keycloak JWKS endpoint
4. Spring Security extracts roles from JWT claims, enforces `@PreAuthorize`

---

## 10. Deployment Architecture (AKS)

### Kubernetes Resource Plan

```
Namespace: perapulse

Deployments (1 replica each for MVP):
  ├── api-gateway            (ClusterIP :8080)
  ├── user-service           (ClusterIP :8081)
  ├── feed-service           (ClusterIP :8082)
  ├── opportunities-service  (ClusterIP :8083)
  ├── events-service         (ClusterIP :8084)
  ├── notification-service   (ClusterIP :8085)
  ├── analytics-service      (ClusterIP :8086)
  ├── keycloak               (ClusterIP :8080; NodePort or LoadBalancer for setup)
  └── react-web-app          (ClusterIP :80; served as static assets)

Ingress (NGINX):
  /           → react-web-app:80
  /auth       → keycloak:8080
  /api        → api-gateway:8080

Managed Services (Azure):
  ├── Azure Database for PostgreSQL Flexible Server
  │     databases: user_db, feed_db, opportunities_db, events_db,
  │                notification_db, analytics_db
  ├── Azure Event Hubs (Kafka endpoint) — topics: perapulse.feed.events,
  │     perapulse.opportunities.events, perapulse.platform.events, perapulse.user.events
  ├── Azure Container Registry (ACR)
  └── Azure Blob Storage (media uploads)

ConfigMaps & Secrets:
  ├── keycloak-config (issuer URL, realm name)
  ├── db-credentials (per service, from Key Vault or K8s Secret)
  └── kafka-sasl-config (Event Hubs connection string)
```

### Local Development Stack (Docker Compose)

```yaml
services:
  postgres:          # Single Postgres instance, multiple databases
  keycloak:          # Keycloak with pre-configured perapulse realm
  redpanda:          # Kafka-compatible, lightweight
  redpanda-console:  # UI for topic inspection
  user-service:
  feed-service:
  opportunities-service:
  events-service:
  notification-service:
  analytics-service:
  api-gateway:
  react-web:
```

### CI/CD Pipeline (GitHub Actions)

```
Push to main →
  1. Build & test each service (Maven/Gradle)
  2. Build Docker images (multi-stage)
  3. Push to ACR
  4. Apply K8s manifests to AKS (kubectl apply or Helm)
```

---

## 11. Repository Structure (Proposed)

```
PeraPulse/
├── services/
│   ├── user-service/
│   ├── feed-service/
│   ├── opportunities-service/
│   ├── events-service/
│   ├── notification-service/
│   ├── analytics-service/
│   └── api-gateway/
├── clients/
│   ├── web/                  # React + Vite
│   └── mobile/               # React Native (Expo)
├── infra/
│   ├── k8s/                  # Kubernetes manifests
│   ├── docker-compose.yml
│   └── keycloak/             # Realm export JSON
├── docs/
│   ├── architecture/         # All diagrams (draw.io / Mermaid)
│   ├── api/                  # OpenAPI spec-first YAML per service (written before coding)
│   │   ├── user-service.yaml
│   │   ├── feed-service.yaml
│   │   ├── opportunities-service.yaml
│   │   ├── events-service.yaml
│   │   ├── notification-service.yaml
│   │   └── analytics-service.yaml
│   ├── brainstorm/           # Proposal and brainstorm notes
│   └── research/             # LinkedIn/FB platform research findings
├── .github/
│   └── workflows/            # CI/CD GitHub Actions
└── README.md
```

---

## 12. 2-Week Sprint Plan

### Week 1 — Foundation & Core Services

| Day | Task |
|---|---|
| 1 | Repo setup, Docker Compose, Keycloak realm config (self-hosted), OpenAPI specs written for all services |
| 2–3 | `user-service` + `feed-service` (CRUD + Kafka publish to domain topics) |
| 4–5 | `opportunities-service` + `events-service` (CRUD + Kafka publish) |
| 6–7 | `notification-service` + `analytics-service` Kafka consumers across all 4 topics; Alumni role request flow Phase 1 |

### Week 2 — Clients, Cloud & Polish

| Day | Task |
|---|---|
| 8–9 | Single React app (auth, feed, jobs, events, notifications, role request pages) |
| 10 | React Native mobile (login, feed, jobs, events screens) |
| 11 | AKS deployment, Azure DB, Event Hubs (4 topics) wiring |
| 12 | CI/CD pipeline, ACR setup, ingress config, OpenAPI Swagger UI live |
| 13 | Keycloak Admin API integration for role approval (Phase 2 stretch); analytics dashboard |
| 14 | Demo prep, final documentation, README |

### MVP Must-Haves (Definition of Done)

- [ ] Keycloak login works on web + mobile (self-hosted on AKS)
- [ ] Feed: create, list, like, comment
- [ ] Jobs: create, list, apply, view applications
- [ ] Events: create, list, RSVP
- [ ] Alumni role request flow (Phase 1 at minimum: DB + endpoints + manual Keycloak)
- [ ] All 4 Kafka topics active; `EventCreated` → Notification + Analytics flow working end-to-end
- [ ] All services deployed on AKS
- [ ] Ingress routes working (NGINX → Gateway → Services)
- [ ] OpenAPI specs written and Swagger UI accessible
- [ ] Architecture diagrams completed (SOA, Enterprise, Deployment, Product Modularity)
- [ ] **Stretch:** Keycloak Admin API call on role approval (Phase 2)

---

## 13. Quality Attribute Justifications

| Quality Attribute | Mechanism |
|---|---|
| **Security** | Keycloak OIDC/PKCE, JWT validation per service, RBAC via Spring Security, secrets in K8s/Key Vault |
| **Scalability** | Stateless services on AKS (horizontal pod autoscaling possible), managed PostgreSQL, Event Hubs partitioning |
| **Maintainability** | Database per service, bounded contexts, shared event envelope contract, OpenAPI specs |
| **Observability** | `X-Correlation-Id` header propagation, structured logging (future: Azure Monitor) |
| **Resilience** | Kafka decoupling prevents cascade failures; retry logic on consumers |
| **Modularity** | Services deployable/upgradeable independently; optional services (analytics, research) can be omitted |
| **Interoperability** | REST APIs + Kafka standard; same APIs consumed by Web and Mobile clients |

---

## 14. Design Decisions Log

### ✅ Locked Decisions

| # | Decision | Resolution |
|---|---|---|
| 1 | API Gateway | **Spring Cloud Gateway** — unified JWT validation, cross-cutting filters |
| 3 | Keycloak Hosting | **Self-hosted on AKS** — Keycloak 24.x Docker image, full realm control |
| 8 | Frontend | **Single React app** — route-based navigation (no micro-frontends) |
| 9 | OpenAPI | **Spec-first** — write YAML specs before coding; Springdoc generates Swagger UI from them |
| 10 | Alumni Role | **Self-request with admin approval** — Phase 1: manual Keycloak; Phase 2 stretch: Keycloak Admin REST API |

### 🔲 Still Open

| # | Decision | Options | Notes |
|---|---|---|---|
| 2 | Mobile Framework | React Native (Expo) vs Flutter | Leaning Expo for code reuse |
| 4 | Blob Storage | Azure Blob vs external image URLs | De-scope file upload for MVP; use URLs |
| 5 | Research Service | Stretch vs de-scope | Keep as stretch, no sprint time allocated |
| 6 | Messaging (DM) | Stub endpoint vs WebSocket | Stub only for MVP |
| 7 | Postgres Deployment | One PG server (multi-DB) vs separate servers | One Flexible Server, multiple databases (cost-effective for mini project) |

---

*End of Document — v1.1*
