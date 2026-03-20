# PeraPulse — Project Report Guide & Task Breakdown

> Reference: `miniproject_guide.md` | Course: CO528 Applied Software Architecture

This document maps the report deliverables to our actual implementation and assigns concrete writing tasks for each section.

---

## Report Structure Overview

| # | Section | Owner (Role) | Status |
|---|---------|-------------|--------|
| 1 | Architecture Diagrams | Solution Architect + App Architect | Partially drafted |
| 2 | Implementation Details | Application Architect | Code exists, needs documenting |
| 3 | Cloud Deployment Details | DevOps Architect | AKS guide exists, needs summary |
| 4 | Research Findings | Enterprise Architect | To be written |
| 5 | Design Justifications | All | To be written |
| 6 | Appendix (Screenshots, README, links) | All | Ongoing |

---

## Section 1 — Architecture Diagrams

The marking guide requires **four specific diagram types**. We have sketch blueprints in `docs/architecture/architecture_diagram_sketches.md`. These must be turned into clean, presentable diagrams.

### 1.1 SOA Diagram — Service Interactions & API Endpoints

**What to show:**
- All 7 microservices as separate, named boxes: `api-gateway`, `user-service`, `feed-service`, `opportunities-service`, `events-service`, `notification-service`, `analytics-service`
- REST/HTTP arrows between services (label: OpenFeign where applicable, e.g., Feed → User for profile enrichment)
- Kafka/Event bus as a central broker, with publishers and consumers labeled per topic:
  - `perapulse.feed.events` → notification-service, analytics-service
  - `perapulse.opportunities.events` → notification-service, analytics-service
  - `perapulse.platform.events` → notification-service, analytics-service
  - `perapulse.user.events` → analytics-service
- Web client and Mobile client (placeholder) hitting the API gateway
- Keycloak as the external identity provider (shown separately, connected to api-gateway)

**Key API endpoints to annotate** (reference `docs/api/*.yaml`):
- `GET /api/profiles/me`, `PUT /api/profiles/me`
- `POST /api/posts`, `GET /api/posts`, `POST /api/posts/{id}/like`, `POST /api/posts/{id}/comments`
- `GET /api/opportunities`, `POST /api/opportunities`, `POST /api/applications`
- `GET /api/events`, `POST /api/events`, `POST /api/rsvps`
- `GET /api/notifications`
- `GET /api/analytics/dashboard`

**Tools:** Draw.io, Lucidchart, or PlantUML (C4 Component diagram style recommended)

---

### 1.2 Enterprise Architecture Diagram

**What to show:**
- High-level view: Users (Student, Alumni, Admin) → Platform → External Systems
- User roles and what each role can access (role-based access enforced at API gateway via JWT claims from Keycloak)
- Departmental workflow: students join → post/engage → apply for jobs/events → alumni connect → admins manage
- Module groupings: Identity & Auth | Social Platform | Career Services | Events & Notifications | Analytics

**Suggested layout (top-down):**
```
[Students / Alumni / Admins]
         ↓
[Keycloak Identity Provider] ←→ [API Gateway (JWT validation)]
         ↓
┌────────────────────────────────────────────────────┐
│  Core Platform Services                            │
│  User Service | Feed Service | Opportunities |     │
│  Events Service                                    │
└────────────────────────────────────────────────────┘
         ↓
[Supporting Services: Notifications | Analytics]
         ↓
[Shared Infrastructure: PostgreSQL | Kafka/Event Hubs]
```

---

### 1.3 Product Modularity Diagram

**What to show:**
- Core modules (required, always deployed): User Management, Feed & Posts, API Gateway, Auth (Keycloak)
- Standard modules (implemented): Opportunities, Events, Notifications, Analytics
- Optional / future modules: Messaging, Research Collaboration, Mobile Client
- Shared reusable components: JWT validation (gateway), Kafka event publishing pattern, OpenAPI specs, Flyway migrations
- Show that each module can be independently scaled and deployed

**Framing for the report:**
- Each Spring Boot service is a deployable unit with its own database (database-per-service pattern)
- New features can be added as new services without modifying existing ones
- The API Gateway is the single extension point for routing

---

### 1.4 Deployment Diagram — Cloud, Database, Media Storage

**What to show (production AKS deployment):**
- **External**: Users → Vercel (web frontend) / Azure CDN → NGINX Ingress Controller (public IP)
- **AKS Cluster** (namespace: `perapulse`):
  - NGINX Ingress → API Gateway Pod (ClusterIP :8080)
  - API Gateway → [user-service, feed-service, opportunities-service, events-service, notification-service, analytics-service] (all ClusterIP)
  - Keycloak Pod (ClusterIP :8080)
  - PostgreSQL Pod (single instance, 7 databases)
  - Redpanda / Azure Event Hubs (Kafka)
- **Azure Resources**: AKS cluster (2× Standard_B2als_v2 nodes), Azure Event Hubs (Kafka-compatible)
- **Vercel**: React web SPA (CDN-distributed, environment vars for API/OIDC endpoints)
- **Note on mobile**: Placeholder, not yet deployed

**Reference**: `docs/architecture/aks-deployment-guide.md` for exact resource names and commands.

---

## Section 2 — Implementation Details

### 2.1 Features Implemented

Write a table covering each project requirement and its implementation status:

| Requirement | Implemented | Service | Notes |
|-------------|-------------|---------|-------|
| Register/Login | Yes | user-service + Keycloak | OIDC/PKCE via Keycloak; profile created on first login |
| Edit Profile | Yes | user-service | `PUT /api/profiles/me` |
| Roles (Student, Alumni, Admin) | Yes | Keycloak + user-service | Role assignment via Keycloak realm; alumni role request workflow |
| Auth for web/mobile | Partial | api-gateway + Keycloak | Web: fully working PKCE; Mobile: placeholder configured in Keycloak |
| Post text updates | Yes | feed-service | `POST /api/posts` |
| Upload images/videos | No | — | Not implemented; future work |
| Like/Comment | Yes | feed-service | `POST /api/posts/{id}/like`, `POST /api/posts/{id}/comments` |
| Share posts | No | — | Not implemented |
| Post jobs/internships | Yes | opportunities-service | Alumni/Admin only |
| Apply for opportunities | Yes | opportunities-service | `POST /api/applications` |
| Department events | Yes | events-service | CRUD for events |
| RSVP system | Yes | events-service | `POST /api/rsvps` |
| Notifications | Yes | notification-service | Event-driven via Kafka; in-app notifications |
| Research Collaboration | No | — | Not implemented; future scope |
| Direct Messaging | No | — | Not implemented; future scope |
| Push Notifications | No | — | In-app only; no FCM/APNS |
| Analytics Dashboard | Yes | analytics-service | Admin dashboard: user counts, post/job/event metrics |

### 2.2 Client Integration

**Web Client (React 19 + Vite):**
- Authentication: `react-oidc-context` + `oidc-client-ts` (PKCE flow against Keycloak)
- API calls: Axios with JWT bearer token injected from OIDC context
- State: Zustand for global auth/user state; TanStack Query for server state caching
- Routing: React Router v7 with role-based route guards
- Deployed to: Vercel (`vercel.json` with SPA rewrite rule)

**Mobile Client:**
- Status: Placeholder only — Keycloak client `perapulse-mobile` is configured (PKCE public client)
- Planned stack: React Native + Expo

### 2.3 Module Communication

Describe the two communication patterns used:

**Synchronous (REST via OpenFeign):**
- feed-service calls user-service to enrich posts with author profile data
- All clients communicate via API Gateway (REST/HTTP, JWT-authenticated)

**Asynchronous (Kafka/Event-driven):**
- feed-service, opportunities-service, events-service publish domain events to Kafka topics
- notification-service consumes all topics → creates in-app notifications
- analytics-service consumes all topics → aggregates platform metrics
- Dev broker: Redpanda | Prod broker: Azure Event Hubs (Kafka-compatible endpoint)

---

## Section 3 — Cloud Deployment Details

### 3.1 Backend Setup

**Platform:** Azure Kubernetes Service (AKS)
- 2-node cluster: `Standard_B2als_v2` (cost-optimised)
- NGINX Ingress Controller as the public entry point
- All services deployed as Kubernetes `Deployment` + `Service` (ClusterIP) resources
- Namespace: `perapulse`

**Kubernetes manifests:** Located in `infra/k8s/`
- Deployment + Service YAMLs per microservice
- ConfigMaps for environment variables
- Secrets for DB credentials and Kafka connection strings

**Build & push pipeline:**
- Two-stage Docker builds (Maven build → Eclipse Temurin 21 JRE Alpine runtime)
- Images pushed to container registry (add your registry URL here)

### 3.2 Database Setup

- **Single PostgreSQL 16 instance** running in-cluster
- **7 databases** (one per service + Keycloak): `user_db`, `feed_db`, `opportunities_db`, `events_db`, `notification_db`, `analytics_db`, `keycloak_db`
- Initialised via `infra/postgres/init.sql`
- Schema migrations managed by **Flyway** (runs on service startup, `src/main/resources/db/migration/`)

**Scalability consideration:** For production at scale, each service's database should be migrated to a managed service (e.g., Azure Database for PostgreSQL Flexible Server) for HA, automated backups, and independent scaling.

### 3.3 Scalability Considerations

| Concern | Current Approach | Path to Scale |
|---------|-----------------|---------------|
| Service scaling | Single pod per service | HPA (Horizontal Pod Autoscaler) on CPU/memory |
| Database | Shared in-cluster PostgreSQL | Migrate to managed Azure PostgreSQL per service |
| Message broker | Redpanda (single node) | Azure Event Hubs (managed, already wired for prod) |
| Frontend | Vercel (CDN) | Already globally distributed |
| Auth | Single Keycloak pod | Keycloak HA / managed identity (Azure AD B2C future option) |
| Statelessness | All services are stateless (JWT-validated) | Scales horizontally without session sharing |

---

## Section 4 — Research Findings

### 4.1 Platforms to Analyse

Research the following platforms and note architectural patterns relevant to PeraPulse:

| Platform | Focus Area |
|----------|------------|
| **LinkedIn** | Professional networking, job listings, alumni connections, event notifications, feed ranking |
| **Facebook** | Social feed, media uploads, groups, events, messaging, notification infrastructure |
| **Slack/Discord** | Real-time messaging, group channels, notification delivery |
| **Handshake** | University-specific career platform — closest analogue to PeraPulse |

### 4.2 What to Write

For each platform, document:
1. **Architecture used** (microservices? monolith? event-driven?)
2. **How they handle scale** (feed fanout, notification delivery, etc.)
3. **Features they have that PeraPulse does not** — identify gaps

### 4.3 Identified Gaps in PeraPulse (vs. Real Platforms)

Use this as a starting point and expand with research:

| Missing Feature | Found In | Proposed Addition |
|----------------|----------|-------------------|
| Media uploads (images/video) | All platforms | S3/Azure Blob storage + CDN; separate media-service |
| Direct messaging | FB, LinkedIn, Slack | WebSocket-based messaging-service |
| Research collaboration | ResearchGate, Academia.edu | Project board + document sharing service |
| Post sharing/reposting | FB, LinkedIn | Extend feed-service schema |
| Push notifications (mobile) | All | FCM/APNS integration in notification-service |
| Feed algorithm/ranking | FB, LinkedIn | ML-based ranking; currently chronological only |
| Search (users, posts, jobs) | LinkedIn, FB | Elasticsearch-backed search-service |
| Mobile app | All | React Native (currently placeholder) |
| Email notifications | All | SMTP/SES integration in notification-service |

---

## Section 5 — Design Justifications

Write a paragraph or short bullet list for each decision. Reference the quality attributes from CO528:

### 5.1 Architecture Pattern — Microservices

**Decision:** Each domain (users, feed, opportunities, events, notifications, analytics) is a separate deployable service.

**Justification:**
- **Modifiability**: Each service can be updated independently (e.g., feed algorithm change doesn't require redeploying auth)
- **Scalability**: Feed and analytics services are read-heavy and can be scaled out independently
- **Team autonomy**: Each team member can own a service
- **Fault isolation**: A notification-service failure does not bring down the feed

**Trade-off acknowledged:** Higher operational complexity vs. a monolith.

### 5.2 Event-Driven Architecture (Kafka)

**Decision:** Cross-service notifications and analytics are driven by Kafka events, not direct REST calls.

**Justification:**
- **Loose coupling**: feed-service does not need to know about notification-service or analytics-service
- **Resilience**: Consumers can be offline and catch up from the Kafka log
- **Extensibility**: New consumers (e.g., email service, ML pipeline) can be added without changing publishers

### 5.3 Database-per-Service

**Decision:** Each service has its own database schema; no shared DB.

**Justification:**
- **Encapsulation**: No service can directly access another service's data, enforcing service boundaries
- **Independent schema evolution**: user-service schema changes don't require feed-service redeployment

### 5.4 API Gateway Pattern

**Decision:** Single API Gateway (Spring Cloud Gateway) as the entry point.

**Justification:**
- **Security**: JWT validation happens once at the gateway, not duplicated in each service
- **Simplicity for clients**: Web/mobile only need one base URL
- **Cross-cutting concerns**: Rate limiting, logging, CORS handled centrally

### 5.5 Keycloak for Identity

**Decision:** Externalize authentication to Keycloak (OIDC/PKCE).

**Justification:**
- **Security**: No password storage in application code; OAuth2/OIDC is the industry standard
- **Role management**: Roles (STUDENT, ALUMNI, ADMIN) managed centrally, propagated via JWT claims
- **Standards compliance**: Works with any OIDC-compliant client (web, mobile, CLI)

### 5.6 Vercel for Web Frontend

**Decision:** Deploy React SPA to Vercel instead of in-cluster.

**Justification:**
- **Performance**: Global CDN distribution with zero configuration
- **Separation of concerns**: Frontend deploy cycle independent of backend
- **Cost**: Free tier sufficient for academic project scale

---

## Section 6 — Appendix & Additional Materials

### 6.1 Screenshots to Capture

Take screenshots of every working feature in the web client:

- [ ] Login page / Keycloak OIDC redirect
- [ ] Home feed with posts
- [ ] Create post form
- [ ] Like / comment interaction
- [ ] Opportunities listing page
- [ ] Opportunity detail + Apply button
- [ ] Events listing page
- [ ] RSVP confirmation
- [ ] Notifications panel
- [ ] Admin dashboard with analytics charts
- [ ] User profile page (own + another user's)
- [ ] Role request flow (alumni upgrade)
- [ ] Admin user management panel

### 6.2 Demo Link

- **Web client (Vercel):** Add deployed URL here
- **API Gateway (AKS):** Add public IP/hostname here
- **Swagger UIs** (for judges): `http://<gateway>:<port>/swagger-ui.html` per service

### 6.3 GitHub Repository

- **URL:** Add GitHub repo URL here
- **Branch structure:** `main` (stable) / `prod` (production deployments) / feature branches per service
- **README:** Already exists at `README.md` — ensure it covers local dev setup, cloud deployment steps, and architecture overview

### 6.4 Document Checklist

Before submission, verify the report contains:

- [ ] All 4 architecture diagrams (SOA, Enterprise, Product Modularity, Deployment)
- [ ] Feature implementation table (Section 2.1)
- [ ] Client integration description (web + mobile placeholder)
- [ ] Module communication explanation (REST + Kafka)
- [ ] Cloud deployment details (AKS setup, database, scalability)
- [ ] Research findings (at least 2 platforms analysed, gap analysis table)
- [ ] Design justifications (at least 5 decisions with quality attribute references)
- [ ] Screenshots for all implemented features
- [ ] Demo links (live web + API)
- [ ] GitHub repository link with clean README

---

## Quick Reference — Project Implementation vs. Requirements

| Project Requirement | Implemented | Evidence |
|--------------------|-------------|---------|
| SOA (separate services with APIs) | Yes | 7 Spring Boot services, OpenAPI specs in `docs/api/` |
| Web client | Yes | `clients/perapulse-web/` — React 19, deployed on Vercel |
| Mobile client | Partial | Keycloak client configured; app is placeholder |
| Cloud deployment | Yes | AKS cluster (see `docs/architecture/aks-deployment-guide.md`) |
| Enterprise architecture | Yes (doc needed) | Keycloak roles, service integration via gateway |
| Product modularity | Yes (doc needed) | Core + optional services, database-per-service |
| User management (register/login/roles) | Yes | user-service + Keycloak |
| Feed & posts | Yes | feed-service (text posts, likes, comments) |
| Jobs & internships | Yes | opportunities-service |
| Events & RSVP | Yes | events-service |
| Notifications | Yes | notification-service (event-driven via Kafka) |
| Analytics dashboard | Yes | analytics-service + admin UI |
| Research collaboration | No | Future scope |
| Messaging | No | Future scope |
