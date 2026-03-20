# Diagram 1 — SOA Diagram: Service Interactions & API Endpoints

> Shows every microservice, synchronous REST communication, asynchronous Kafka event flow, and the API endpoints exposed through the API Gateway.

```mermaid
flowchart TD
    subgraph CL["Clients"]
        direction LR
        WEB["React Web App\nVite · React 19 · Vercel"]
        MOB["React Native Mobile\nExpo · Planned"]
    end

    subgraph EDGE["Edge & Auth Layer"]
        direction LR
        NG["NGINX Ingress Controller\nPublic Entry Point"]
        KC["Keycloak 26.x\nRealm: perapulse\nOIDC · PKCE · JWKS"]
    end

    GW["API Gateway\nSpring Cloud Gateway · :8080\nJWT Validation · Routing · CORS"]

    subgraph CORE["Core Microservices — REST + Kafka Producers"]
        direction LR
        US["User Service\n:8081\n/api/profiles/* · /api/admin/*"]
        FS["Feed Service\n:8082\n/api/posts/* · /api/comments/*"]
        OS["Opportunities Service\n:8083\n/api/opportunities/* · /api/applications/*"]
        ES["Events Service\n:8084\n/api/events/* · /api/rsvps/*"]
    end

    subgraph KAFKA["Kafka Event Bus · Dev: Redpanda · Prod: Azure Event Hubs"]
        direction LR
        T1["perapulse.feed.events\nPostCreated · PostLiked · CommentAdded"]
        T2["perapulse.opportunities.events\nOpportunityPosted · ApplicationSubmitted · StatusUpdated"]
        T3["perapulse.platform.events\nEventCreated · RSVPUpdated"]
        T4["perapulse.user.events\nRoleRequestSubmitted · Approved · Rejected"]
    end

    subgraph SUPPORT["Supporting Services — Kafka Consumers"]
        direction LR
        NS["Notification Service\n:8085\n/api/notifications/*\nConsumer Group: notification-service-cg"]
        AN["Analytics Service\n:8086\n/api/analytics/*\nConsumer Group: analytics-service-cg"]
    end

    subgraph STRETCH["Stretch / Planned Services"]
        direction LR
        RS["Research Service\n:8087\n/api/projects/* · Planned"]
        MS["Messaging Service\n/api/messages/* · Planned"]
    end

    subgraph DBS["PostgreSQL 16 — Database per Service"]
        direction LR
        UDB[("user_db")]
        FDB[("feed_db")]
        ODB[("opp_db")]
        EDB[("events_db")]
        NDB[("notif_db")]
        ADB[("analytics_db")]
    end

    %% ── Client to Edge ──────────────────────────────────────────
    WEB & MOB -->|HTTPS| NG
    NG -->|"/api/*"| GW
    NG -->|"/auth/*"| KC
    GW <-.->|"JWT Validation\nJWKS Endpoint"| KC

    %% ── Gateway to Services (REST) ──────────────────────────────
    GW -->|"/api/profiles/*\n/api/admin/*"| US
    GW -->|"/api/posts/*\n/api/comments/*"| FS
    GW -->|"/api/opportunities/*\n/api/applications/*"| OS
    GW -->|"/api/events/*\n/api/rsvps/*"| ES
    GW -->|"/api/notifications/*"| NS
    GW -->|"/api/analytics/*"| AN

    %% ── Internal Sync (OpenFeign) ───────────────────────────────
    FS -.->|"Internal Sync\nOpenFeign\nProfile Enrichment"| US

    %% ── Service to Database ─────────────────────────────────────
    US --- UDB
    FS --- FDB
    OS --- ODB
    ES --- EDB
    NS --- NDB
    AN --- ADB

    %% ── Kafka Producers ─────────────────────────────────────────
    FS ==>|"PRODUCE"| T1
    OS ==>|"PRODUCE"| T2
    ES ==>|"PRODUCE"| T3
    US ==>|"PRODUCE"| T4

    %% ── Kafka Consumers ─────────────────────────────────────────
    T1 & T2 & T3 & T4 ==>|"CONSUME\nAll 4 Topics"| NS
    T1 & T2 & T3 ==>|"CONSUME\n3 Topics"| AN

    %% ── Styles ──────────────────────────────────────────────────
    classDef client    fill:#D6EAF8,stroke:#2E86C1,color:#1a1a1a
    classDef edge      fill:#2E86C1,color:#fff,stroke:#1A5276
    classDef gateway   fill:#1A5276,color:#fff,stroke:#154360
    classDef keycloak  fill:#8E44AD,color:#fff,stroke:#6C3483
    classDef core      fill:#27AE60,color:#fff,stroke:#1E8449
    classDef kafka     fill:#E67E22,color:#fff,stroke:#CA6F1E
    classDef support   fill:#F39C12,color:#fff,stroke:#D68910
    classDef stretch   fill:#BDC3C7,stroke:#95A5A6,color:#2c2c2c,stroke-dasharray:5 5
    classDef db        fill:#1ABC9C,color:#fff,stroke:#17A589

    class WEB,MOB client
    class NG edge
    class GW gateway
    class KC keycloak
    class US,FS,OS,ES core
    class T1,T2,T3,T4 kafka
    class NS,AN support
    class RS,MS stretch
    class UDB,FDB,ODB,EDB,NDB,ADB db
```

*Figure 1: Service-Oriented Architecture of PeraPulse, illustrating the seven microservices, synchronous REST communication via the API Gateway, asynchronous event-driven integration over the Kafka message bus, internal OpenFeign service-to-service calls, and the database-per-service deployment pattern.*

---

## API Endpoint Reference

| Service | Key Endpoints | Method | Role Required |
|---------|--------------|--------|---------------|
| **User Service** | `/api/profiles/me` | GET, PUT | Any authenticated |
| | `/api/profiles/{sub}` | GET | Any authenticated |
| | `/api/profiles/role-requests` | POST | STUDENT |
| | `/api/admin/users` | GET | ADMIN |
| | `/api/admin/role-requests/{id}/approve` | PUT | ADMIN |
| | `/api/admin/role-requests/{id}/reject` | PUT | ADMIN |
| **Feed Service** | `/api/posts` | GET, POST | Any authenticated |
| | `/api/posts/{id}` | GET, DELETE | Author/ADMIN |
| | `/api/posts/{id}/likes` | POST, DELETE | Any authenticated |
| | `/api/posts/{id}/comments` | GET, POST | Any authenticated |
| **Opportunities Service** | `/api/opportunities` | GET, POST | GET: any; POST: ALUMNI/ADMIN |
| | `/api/opportunities/{id}/apply` | POST | STUDENT |
| | `/api/applications/me` | GET | STUDENT |
| | `/api/applications/{id}/status` | PUT | ALUMNI/ADMIN |
| **Events Service** | `/api/events` | GET, POST | GET: any; POST: ALUMNI/ADMIN |
| | `/api/events/{id}/rsvp` | POST | Any authenticated |
| | `/api/events/{id}/attendees` | GET | ALUMNI/ADMIN |
| **Notification Service** | `/api/notifications` | GET | Any authenticated |
| | `/api/notifications/unread-count` | GET | Any authenticated |
| | `/api/notifications/{id}/read` | POST | Owner |
| | `/api/notifications/read-all` | POST | Any authenticated |
| **Analytics Service** | `/api/analytics/summary` | GET | ADMIN |
| | `/api/analytics/daily` | GET | ADMIN |
| | `/api/analytics/top-posts` | GET | ADMIN |

---

## Kafka Event Payloads Reference

| Topic | Event Type | Key Payload Fields |
|-------|-----------|-------------------|
| `perapulse.feed.events` | `PostCreated` | `postId`, `authorId`, `content`, `timestamp` |
| | `PostLiked` | `postId`, `likerId`, `timestamp` |
| | `CommentAdded` | `postId`, `commentId`, `authorId`, `timestamp` |
| `perapulse.opportunities.events` | `OpportunityPosted` | `opportunityId`, `posterId`, `title`, `type` |
| | `ApplicationSubmitted` | `applicationId`, `applicantId`, `opportunityId` |
| | `ApplicationStatusUpdated` | `applicationId`, `newStatus` |
| `perapulse.platform.events` | `EventCreated` | `eventId`, `organizerId`, `title`, `date` |
| | `RSVPUpdated` | `eventId`, `userId`, `status` |
| `perapulse.user.events` | `RoleRequestSubmitted` | `requestId`, `userId`, `requestedRole` |
| | `RoleRequestApproved` | `requestId`, `userId`, `newRole` |
| | `RoleRequestRejected` | `requestId`, `userId` |

---

## Auth Flow Annotation

```
1. Client  ──PKCE Code Challenge──►  Keycloak
2. Keycloak ──Authorization Code──►  Client
3. Client  ──Code + Verifier──►      Keycloak
4. Keycloak ──JWT (access token)──►  Client
5. Client  ──Bearer <JWT>──►         API Gateway
6. API Gateway ──JWKS lookup──►      Keycloak  (validates signature)
7. API Gateway ──forward + JWT──►    Service
8. Service  ──@PreAuthorize──►       check roles from JWT claims
```
