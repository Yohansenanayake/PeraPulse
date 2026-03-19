# PeraPulse — Architecture Diagram Sketches

> **Purpose:** Detailed drawing notes for all four required architecture diagrams.  
> Use these as exact blueprints to draw final diagrams in draw.io, Lucidchart, or PowerPoint.

---

## Diagram 1 — SOA Diagram (Service Interactions & API Endpoints)

### Overview & Purpose
Shows every microservice, who calls whom (synchronous REST vs. asynchronous Kafka), and the exact API endpoint groups exposed by each service through the API Gateway.

---

### Layout (left-to-right, 3 columns)

```
[Clients]  →  [API Gateway + Keycloak]  →  [Services]  →  [Databases]
                                                ↕ (Kafka)
                                        [Notification + Analytics]
```

---

### Nodes & Boxes

#### Column 1 — Clients (top of diagram)
| Box | Label |
|---|---|
| Box A | **React Web App** (Vite + React 18) |
| Box B | **React Native Mobile App** (Expo) |

Both boxes share a dashed border group labeled **"Clients"**.

#### Column 2 — Edge Layer
| Box | Label | Internal note |
|---|---|---|
| Box C | **NGINX Ingress Controller** | Route rules: `/` → Web; `/auth` → Keycloak; `/api` → API Gateway |
| Box D | **API Gateway** (Spring Cloud Gateway, port 8080) | Validates JWT via JWKS endpoint; routes to downstream services |
| Box E | **Keycloak 26.x** (port 8180 local / self-hosted on AKS) | Realm: `perapulse`; Clients: `web-client`, `mobile-client` (PKCE); Roles: STUDENT, ALUMNI, ADMIN |

Add a **double-headed dashed arrow** between Box D and Box E labeled **"JWT validation (JWKS)"**.

#### Column 3 — Core Microservices (vertical stack)
Draw each as a rectangle with a small DB cylinder attached at the bottom-right.

| Box | Service Label | Port | DB Name | DB Port |
|---|---|---|---|---|
| Box F | **User Service** | :8081 | `user_db` | PostgreSQL |
| Box G | **Feed Service** | :8082 | `feed_db` | PostgreSQL |
| Box H | **Opportunities Service** | :8083 | `opportunities_db` | PostgreSQL |
| Box I | **Events Service** | :8084 | `events_db` | PostgreSQL |
| Box J | **Notification Service** | :8085 | `notification_db` | PostgreSQL |
| Box K | **Analytics Service** | :8086 | `analytics_db` | PostgreSQL |

*(Stretch)* Add a shaded/striped box:
| Box L | **Research Service** *(stretch)* | :8087 | `research_db` | PostgreSQL |

---

### Synchronous REST Connections (solid arrows with labels)

1. **Box A / Box B → Box C**: `HTTPS` (double-headed arrow)
2. **Box C → Box D**: `HTTP /api/*`
3. **Box C → Box E**: `HTTP /auth/*`
4. **Box D → Box F**: `REST /api/profiles/*, /api/admin/*`
5. **Box D → Box G**: `REST /api/posts/*`
6. **Box D → Box H**: `REST /api/opportunities/*, /api/applications/*`
7. **Box D → Box I**: `REST /api/events/*`
8. **Box D → Box J**: `REST /api/notifications/*`
9. **Box D → Box K**: `REST /api/analytics/*`
10. **Box G → Box F**: `REST (OpenFeign) — profile enrichment` *(dashed arrow — internal sync call)*

> **Note:** The OpenFeign call from Feed Service to User Service is a service-to-service call (not through the gateway). Mark it with a dashed line and the annotation "Internal Sync (OpenFeign)".

---

### Asynchronous Kafka Connections (thick colored arrows)

Use a central Kafka bus bar — a wide horizontal rectangle between the services and the notification/analytics section, labeled:

**"Kafka Message Bus"**  
*(Dev: Redpanda | Prod: Azure Event Hubs)*

Inside the bar, draw 4 vertical lanes, each labeled with the topic name:

| Lane | Topic Name | Color suggestion |
|---|---|---|
| 1 | `perapulse.feed.events` | Blue |
| 2 | `perapulse.opportunities.events` | Orange |
| 3 | `perapulse.platform.events` | Green |
| 4 | `perapulse.user.events` | Purple |

**Producers (arrows INTO the Kafka bar):**

| From | Topic Lane | Events Published |
|---|---|---|
| Box G (Feed) | Lane 1 | `PostCreated`, `PostLiked`, `CommentAdded` |
| Box H (Opportunities) | Lane 2 | `OpportunityPosted`, `ApplicationSubmitted`, `ApplicationStatusUpdated` |
| Box I (Events) | Lane 3 | `EventCreated`, `RSVPUpdated` |
| Box F (User) | Lane 4 | `RoleRequestSubmitted`, `RoleRequestApproved`, `RoleRequestRejected` |

**Consumers (arrows FROM the Kafka bar):**

| To | Topics Consumed | Consumer Group |
|---|---|---|
| Box J (Notification) | Lanes 1, 2, 3, 4 (all) | `notification-service-cg` |
| Box K (Analytics) | Lanes 1, 2, 3 | `analytics-service-cg` |

---

### API Endpoint Summary Panel (side panel or table inset)

Draw a scrollable inset table or legend box showing all grouped endpoints:

| Service | Endpoint Groups |
|---|---|
| User | `GET/PUT /api/profiles/me`, `GET /api/profiles/{sub}`, `POST /api/profiles/role-requests`, `GET/PUT /api/admin/users`, `GET/PUT /api/admin/role-requests/{id}/approve|reject` |
| Feed | `POST/GET /api/posts`, `DELETE /api/posts/{id}`, `POST/GET /api/posts/{id}/comments`, `POST/DELETE /api/posts/{id}/likes` |
| Opportunities | `POST/GET /api/opportunities`, `PUT/DELETE /api/opportunities/{id}`, `POST /api/opportunities/{id}/apply`, `GET /api/opportunities/{id}/applications`, `GET /api/applications/me`, `PUT /api/applications/{id}/status` |
| Events | `POST/GET /api/events`, `PUT/DELETE /api/events/{id}`, `POST /api/events/{id}/rsvp`, `GET /api/events/{id}/attendees`, `GET /api/events/me/rsvps` |
| Notification | `GET /api/notifications`, `GET /api/notifications/unread-count`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all` |
| Analytics | `GET /api/analytics/summary`, `GET /api/analytics/daily`, `GET /api/analytics/top-posts` |

---

### Auth Flow Annotation (small callout box, top-right corner)

```
1. Client → Keycloak: Authorization Code + PKCE flow
2. Keycloak → Client: JWT (access token, 5 min)
3. Client → API Gateway: Bearer <JWT>
4. API Gateway → Keycloak: validate via JWKS endpoint
5. API Gateway → Services: forward request with JWT header
6. Services → Keycloak: re-validate JWT via JWKS
7. Spring Security: enforce @PreAuthorize per role
```

---

## Diagram 2 — Enterprise Architecture Diagram (Roles, Modules, Integration)

### Overview & Purpose
High-level view showing **who uses the system** (actors/roles), **what modules exist**, and **how they integrate at a departmental/organizational level**. No code-level detail — focus on business context.

---

### Layout (top-down, 4 swim-lanes + integration layer)

```
[User Roles / Actors]
        ↓
[Client Tier]
        ↓
[Platform Modules]
        ↓
[Integration & Cross-Cutting Services]
        ↓
[Data & Infrastructure Layer]
```

---

### Swim Lane 1 — User Roles / Actors

Draw 4 actor stick-figure columns:

| Actor | Label | Description (hover text / annotation) |
|---|---|---|
| Actor 1 | **Student** | Can view feed, apply for jobs/internships, RSVP to events, request alumni role |
| Actor 2 | **Alumni** | Can post jobs/events, view applications, create events |
| Actor 3 | **Admin** | Full platform access — moderate content, manage users, approve role requests, view analytics |
| Actor 4 | **System (Keycloak)** | Identity provider; assigns roles on registration/approval |

Draw use-case lines from each actor to the relevant modules in Swim Lane 3 (see below).

---

### Swim Lane 2 — Client Tier

| Subsystem | Label | Contents |
|---|---|---|
| Web Client | **React SPA** (Vite + React 18 + shadcn/ui + Tailwind CSS) | Auth, Feed, Jobs, Events, Notifications, Profile, Admin Panel |
| Mobile Client | **React Native (Expo)** | Auth, Feed, Jobs, Events |

- Both share the same API endpoints (Web-Oriented Architecture)
- Auth via **Keycloak PKCE** from both

---

### Swim Lane 3 — Platform Modules (Core Business Capabilities)

Draw as a row of large rounded-rectangle modules, each with a header and bullet list of capabilities:

| Module Box | Module Name | Core Capabilities |
|---|---|---|
| M1 | **Identity & Access Management** | Keycloak realm `perapulse`; OIDC/PKCE; role assignment (STUDENT/ALUMNI/ADMIN); JWT issuance |
| M2 | **User & Profile Management** | User profiles; LinkedIn/bio; role upgrade requests; admin user list |
| M3 | **Social Feed** | Create/view posts; like; comment; media links |
| M4 | **Career Hub** (Opportunities) | Post jobs/internships; apply; track applications; status updates |
| M5 | **Events & Announcements** | Create events; RSVP; view attendees; upcoming filter |
| M6 | **Notification Centre** | In-app notifications; unread count; mark read; event-driven triggers |
| M7 | **Analytics Dashboard** | Daily stats; total counters; top posts; admin-only view |
| M8 *(stretch)* | **Research Collaboration** | Create projects; join requests; member listing |
| M9 *(stretch)* | **Messaging** | Stub DM endpoints; future expansion |

Use a **solid green border** for core (M1–M7) and a **dashed grey border** for stretch (M8–M9).

---

### Swim Lane 4 — Integration & Cross-Cutting Services

Draw a horizontal bar containing:

| Component | Label | Notes |
|---|---|---|
| Kafka Bus | **Event Bus** (Redpanda/Azure Event Hubs) | Decouples producers from consumers; 4 topics |
| API Gateway | **API Gateway** (Spring Cloud Gateway) | Single entry point for all API calls; JWT forward |
| NGINX Ingress | **Ingress Controller** | Route `/`, `/api`, `/auth` to respective destinations |
| CI/CD | **GitHub Actions Pipeline** | Build → Docker → ACR → AKS deploy |

---

### Integration Lines (role → module)

Draw arrows from each Actor to the modules they interact with:

**Student → M2**: View & edit profile, request alumni role  
**Student → M3**: Create posts, like, comment  
**Student → M4**: Browse listings, apply  
**Student → M5**: View events, RSVP  
**Student → M6**: Receive notifications  

**Alumni → M2**: Manage own profile  
**Alumni → M3**: Create posts  
**Alumni → M4**: Create listings, view applications, update status  
**Alumni → M5**: Create events, view RSVPs  
**Alumni → M6**: Receive notifications  
**Alumni → M8 (stretch)**: Create research projects  

**Admin → ALL modules**: Full access including M7 (Analytics), moderation in M3/M4/M5  
**System (Keycloak) → M1**: Manages tokens, PKCE flows, role assignments  

---

### Department Integration Box (corner annotation)

Draw a small box in the top-left corner:
```
Department of Computer Engineering
University of Peradeniya
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Faculty/Staff = Admins
• Current Students = Students (auto STUDENT role)
• Graduates = can upgrade to ALUMNI role
```

---

### Authorization Matrix (legend table, bottom of diagram)

| Capability | STUDENT | ALUMNI | ADMIN |
|---|---|---|---|
| View feed/events/jobs | ✅ | ✅ | ✅ |
| Create posts | ✅ | ✅ | ✅ |
| Apply for jobs | ✅ | ❌ | ✅ |
| Post jobs/events | ❌ | ✅ | ✅ |
| Delete any content | ❌ | ❌ | ✅ |
| View analytics | ❌ | ❌ | ✅ |
| Approve alumni role | ❌ | ❌ | ✅ |
| Request alumni role | ✅ | N/A | N/A |

---

## Diagram 3 — Product Modularity Diagram (Core + Optional Features)

### Overview & Purpose
Shows the **modular product architecture** — which modules form the mandatory core, which are optional/add-on, and how they relate through shared components and interfaces.

---

### Layout (layered concentric-ring or tiered-block style)

Recommended: **3-tier layered block diagram**

```
┌──────────────────────────── PLATFORM CORE ──────────────────────────────┐
│                                                                         │
│  ┌─────────────────── SHARED FOUNDATION ──────────────────────┐         │
│  │  API Gateway  │  Keycloak Auth  │  Common Event Envelope   │         │
│  └─────────────────────────────────────────────────────────────┘         │
│                                                                         │
│  ┌──────────────────── CORE MODULES ───────────────────────────┐         │
│  │  User/Profile  │  Social Feed  │  Opportunities │ Events   │         │
│  └─────────────────────────────────────────────────────────────┘         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────── INTEGRATION LAYER ──────────────────────────────────┐
│              Kafka Event Bus (4 topics)                                 │
│  perapulse.feed.events | perapulse.opportunities.events                 │
│  perapulse.platform.events | perapulse.user.events                      │
└────────────────────────────────────────────────────────────────────────┘

┌──────────────────── OPTIONAL MODULES ───────────────────────────────────┐
│  Notification Service  │  Analytics Service                             │
└────────────────────────────────────────────────────────────────────────┘

┌──────────────────── STRETCH / FUTURE MODULES ───────────────────────────┐
│  Research Collaboration  │  Direct Messaging  │  Push Notifications     │
└────────────────────────────────────────────────────────────────────────┘

┌──────────────────── CLIENT LAYER ───────────────────────────────────────┐
│     React Web SPA     │     React Native Mobile     │                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Tier-by-Tier Drawing Instructions

#### Tier 0 — Shared Foundation (yellow/gold background)

| Component | Details |
|---|---|
| **API Gateway** | Spring Cloud Gateway; all external traffic enters here; JWT forwarding |
| **Keycloak Auth** | Realm `perapulse`; PKCE; JWT issuance; JWKS; role management |
| **Common Event Envelope** | Shared JSON schema: `{eventId, eventType, timestamp, producer, topic, data}` |
| **Database per Service** | PostgreSQL 16; one schema per service (maintainability principle) |

> Design principle: Any new module can be added without touching these components.

#### Tier 1 — Core Modules (green background, "MUST HAVE")

Draw each as a tall card/column:

| Module Card | Service | What it owns | Key APIs | Kafka Role |
|---|---|---|---|---|
| **User & Profile** | `user-service` :8081 | user_profile, role_request tables | `/api/profiles/*`, `/api/admin/*` | Producer: `perapulse.user.events` |
| **Social Feed** | `feed-service` :8082 | post, comment, post_like tables | `/api/posts/*` | Producer: `perapulse.feed.events` |
| **Career Hub** | `opportunities-service` :8083 | opportunity, application tables | `/api/opportunities/*`, `/api/applications/*` | Producer: `perapulse.opportunities.events` |
| **Events** | `events-service` :8084 | event, rsvp tables | `/api/events/*` | Producer: `perapulse.platform.events` |

Each card should show:
- Service name + port as a header
- DB schema name
- A bullet list of 2–3 key features
- A small Kafka "publish" arrow pointing down to the integration layer

#### Tier 2 — Integration Layer (grey background)

One wide horizontal bar:

```
Kafka Event Bus
Dev: Redpanda (Docker) → Prod: Azure Event Hubs (Kafka endpoint)
4 Topics:
  ├── perapulse.feed.events         [PostCreated, PostLiked, CommentAdded]
  ├── perapulse.opportunities.events [OpportunityPosted, ApplicationSubmitted, ApplicationStatusUpdated]
  ├── perapulse.platform.events      [EventCreated, RSVPUpdated]
  └── perapulse.user.events          [RoleRequestSubmitted, RoleRequestApproved, RoleRequestRejected]
```

#### Tier 3 — Optional Enhancement Modules (orange/amber background, "SHOULD HAVE")

| Module Card | Service | What it owns | Kafka Consumer |
|---|---|---|---|
| **Notification Centre** | `notification-service` :8085 | notification table; SSE delivery | All 4 topics → `notification-service-cg` |
| **Analytics Dashboard** | `analytics-service` :8086 | platform_stats, aggregate_counter tables | 3 topics → `analytics-service-cg` |

Draw consume arrows FROM the Kafka bar INTO these modules.

Annotation: *"Can be deployed/removed independently without affecting core modules"*

#### Tier 4 — Stretch / Future Modules (dashed border, red/grey, "COULD HAVE")

| Module | Description | Status |
|---|---|---|
| **Research Collaboration** | `research-service` :8087; project listings + join; `research_db` | Stretch goal |
| **Direct Messaging** | DM between users; stub endpoints only for MVP | Stub in MVP |
| **Push Notifications** | Firebase/APNs; extends Notification Service | Future |
| **Media Upload** | Azure Blob Storage integration; `media_url` stored in DB | Partially scoped |

#### Tier 5 — Client Layer (blue background, top)

| Client | Technology | Features |
|---|---|---|
| **React Web App** | React 18 + Vite + Zustand + Axios + shadcn/ui | Auth, Feed, Jobs, Events, Notifications, Profile, Admin Panel |
| **React Native Mobile** | Expo + AuthSession | Login, Feed, Jobs, Events |

Both access the API Gateway via HTTPS. Both reuse the **same REST APIs** (Web-Oriented Architecture pattern).

---

### Shared/Reusable Components Callout Box

Draw a side panel:

```
Shared Components / Contracts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ JWT Bearer Auth (all services)
✓ X-Correlation-Id header (all services)
✓ Standard Error Envelope schema
  { timestamp, status, error, message, path }
✓ Pagination params: ?page=0&size=20
✓ OpenAPI spec-first (Swagger UI per service)
✓ Multi-stage Dockerfile (all services)
```

---

### Modularity Principles Annotation (legend box)

```
Modularity Design Decisions:
• Database per Service (no shared schema)
• Service independent deployability (K8s Deployment per service)
• Async decoupling via Kafka (producers/consumers never directly coupled)
• Stretch services have zero core-service dependencies
• Same APIs serve both Web and Mobile (no duplication)
• OpenFeign for optional sync inter-service calls (Feed → User)
```

---

## Diagram 4 — Deployment Diagram (Cloud, Database, Media Storage)

### Overview & Purpose
Shows the exact cloud infrastructure topology — AKS cluster internals, managed Azure services, network paths, and local dev environment. Represents both **production (Azure)** and **local development (Docker Compose)** environments.

---

### Layout (two-environment panels side by side, or stacked)

**Top panel: Production (Azure)**  
**Bottom panel: Local Development (Docker Compose)**

---

### Production Environment — Azure Cloud

#### Outer Boundary Box
Label: **Microsoft Azure Cloud**

Inside Azure, draw the following grouped zones:

---

#### Zone A — Azure Kubernetes Service (AKS) Cluster

> Label: AKS Cluster — Namespace: `perapulse`

Draw a cluster boundary rectangle. Inside, draw the following nodes as Kubernetes Deployment pods (use a rectangle with a Kubernetes pod icon, or just a rounded square):

##### External Entry
| Node | Type | Label | Notes |
|---|---|---|---|
| N1 | Ingress | **NGINX Ingress Controller** | Routes `/` → Web; `/auth` → Keycloak; `/api` → API Gateway |
| N2 | LoadBalancer | **Azure Load Balancer** | Public IP; HTTPS termination; entry from the internet |

Draw an arrow from the internet (a cloud symbol outside the AKS box) → N2 → N1.

##### Application Pods (ClusterIP services)

Draw each pod as a labelled box. Inside each pod box, include the service name, image source, and port:

| Pod | ClusterIP Port | Image Source |
|---|---|---|
| **api-gateway** | :8080 | ACR: perapulse/api-gateway |
| **user-service** | :8081 | ACR: perapulse/user-service |
| **feed-service** | :8082 | ACR: perapulse/feed-service |
| **opportunities-service** | :8083 | ACR: perapulse/opportunities-service |
| **events-service** | :8084 | ACR: perapulse/events-service |
| **notification-service** | :8085 | ACR: perapulse/notification-service |
| **analytics-service** | :8086 | ACR: perapulse/analytics-service |
| **keycloak** (self-hosted) | :8080 | quay.io/keycloak/keycloak:26.x |
| **react-web-app** | :80 | ACR: perapulse/react-web (static assets) |

Draw group arrows:
- **N1 → api-gateway**: `/api` traffic
- **N1 → keycloak**: `/auth` traffic  
- **N1 → react-web-app**: `/` traffic
- **api-gateway → each service pod**: REST (ClusterIP)

##### ConfigMaps & Secrets (draw as small document icons inside the cluster)

| Resource | Contents |
|---|---|
| ConfigMap: `keycloak-config` | Issuer URL, realm name |
| Secret: `db-credentials` | Per-service DB connection strings |
| Secret: `kafka-sasl-config` | Event Hubs connection string |
| Secret: `keycloak-admin` | Keycloak admin credentials |

---

#### Zone B — Azure Managed Services (outside AKS, but inside Azure boundary)

Draw these as managed-service stacked boxes to the right of the AKS cluster:

| Service | Azure Resource | Details |
|---|---|---|
| **Azure Database for PostgreSQL** | Flexible Server | Databases: `user_db`, `feed_db`, `opportunities_db`, `events_db`, `notification_db`, `analytics_db`, `keycloak_db` (7 databases on one server) |
| **Azure Event Hubs** | Kafka endpoint | Topics: `perapulse.feed.events`, `perapulse.opportunities.events`, `perapulse.platform.events`, `perapulse.user.events`; SASL/TLS |
| **Azure Container Registry (ACR)** | Container registry | Stores all Docker images built by CI/CD |
| **Azure Blob Storage** | Blob Storage Account | Media uploads: post images, event banners, resume files; accessed via URLs |

Draw connection arrows:
- **user/feed/opp/events/notif/analytics-service → PostgreSQL**: `JDBC/TLS` connection
- **feed/opp/events/notification/analytics-service → Event Hubs**: `Kafka/SASL` connection
- **feed/opp/events-service → Event Hubs**: PRODUCE (publish events)
- **notification/analytics-service ← Event Hubs**: CONSUME (subscribe)
- **GitHub Actions → ACR**: Docker push (CI/CD)
- **ACR → AKS pods**: Pull on deployment
- **clients → Blob Storage**: `HTTPS` (media URLs)

---

#### Zone C — CI/CD Pipeline (top strip above the AKS box)

Draw a horizontal pipeline strip:

```
GitHub Repository
    → (push to main)
GitHub Actions Workflow
    → Step 1: Maven build + unit test (each service)
    → Step 2: Docker multi-stage build (each service)
    → Step 3: Push images → Azure Container Registry (ACR)
    → Step 4: kubectl apply → AKS (K8s manifests / Helm)
```

Use arrows connecting each step.

---

#### Zone D — User / Internet (outside Azure box)

Draw a cloud symbol (or a simple "Internet" box) with:
- **Browser icon** labeled "Web Browser (HTTPS)"  
- **Mobile icon** labeled "Mobile App (HTTPS)"  

Both pointing to the Azure Load Balancer (N2).

---

### Network Flow Annotation (numbers on arrows)

Optionally number the request flow:
```
① Browser/Mobile -- HTTPS --> Azure Load Balancer
② Load Balancer -- HTTPS --> NGINX Ingress
③ NGINX -- /api --> API Gateway pod
④ API Gateway -- validates JWT --> Keycloak pod
⑤ API Gateway -- REST --> Target service pod
⑥ Service pod -- JDBC --> Azure PostgreSQL
⑦ Service pod -- Kafka PRODUCE --> Azure Event Hubs
⑧ Notification/Analytics -- Kafka CONSUME --> Azure Event Hubs
⑨ Notification Service -- SSE --> Client (notification stream)
```

---

### Local Development Environment (Docker Compose)

Draw a second panel below (or a separate box) labeled:

**Local Dev — Docker Compose**

| Container | Image | Port |
|---|---|---|
| `perapulse-postgres` | postgres:16-alpine | 5432 |
| `perapulse-keycloak` | keycloak:26.5.5 | 8180 (mapped from 8080 internal) |
| `perapulse-redpanda` | redpandadata/redpanda | 9092 (Kafka API) |
| `perapulse-redpanda-console` | redpandadata/console | 8888 (UI) |
| `perapulse-user-service` | local build | 8081 |
| `perapulse-feed-service` | local build | 8082 |
| `perapulse-opportunities-service` | local build | 8083 |
| `perapulse-events-service` | local build | 8084 |
| `perapulse-notification-service` | local build | 8085 |
| `perapulse-analytics-service` | local build | 8086 |
| `perapulse-api-gateway` | local build | 8080 |

Note the **single Postgres instance** hosting all 7 databases (cost-effective for local/mini-project).

Draw a legend comparing prod vs local:

| Component | Local Dev | Production |
|---|---|---|
| Kafka | Redpanda (Docker) | Azure Event Hubs |
| Database | Single Postgres container | Azure PostgreSQL Flexible Server |
| Auth | Keycloak in Docker | Keycloak pod in AKS |
| Container orchestration | Docker Compose | AKS |
| Ingress | Direct port mapping | NGINX Ingress Controller |
| TLS/HTTPS | No (localhost) | Yes (Azure Load Balancer) |

Local dev entry points (add as an annotation box):
```
http://localhost:8080/       → API Gateway (auth test page)
http://localhost:8080/auth   → Keycloak (via gateway)
http://localhost:8180/auth/admin → Keycloak Admin Console (direct)
http://localhost:8888/       → Redpanda Console (Kafka UI)
```

---

## General Drawing Tips

### Colors (suggested palette for consistency)
| Layer | Color |
|---|---|
| Clients (Web/Mobile) | Light Blue (#D6EAF8) |
| API Gateway / Ingress | Dark Blue (#2E86C1) |
| Keycloak / Auth | Purple (#8E44AD) |
| Core Services | Green (#27AE60) |
| Kafka / Event Bus | Orange (#E67E22) |
| Notification / Analytics | Amber (#F39C12) |
| Databases | Teal (#1ABC9C) |
| Azure Managed Services | Light Grey (#F2F3F4) |
| Stretch / Optional | Dashed border, light red |
| CI/CD | Dark grey strip (#566573) |

### Line Styles
| Relationship | Line Style |
|---|---|
| Synchronous REST | Solid arrow, black |
| Kafka produce | Thick solid arrow, orange |
| Kafka consume | Thick dashed arrow, orange |
| Internal sync (OpenFeign) | Dashed arrow, blue |
| JWT validation | Double-headed dashed, purple |
| HTTPS (external) | Solid thick arrow, dark blue |
| DB connection | Solid arrow pointing to cylinder |

### Icon Suggestions (for draw.io)
- Microservice pod → use "Spring Boot" shape or plain rectangle
- Database → cylinder icon
- Kafka → use "queue" or Apache Kafka icon
- Keycloak → use shield/padlock icon
- AKS → use Kubernetes wheel icon
- Azure services → use respective Azure icons from the Azure icon pack

---

*End of Architecture Diagram Sketches — PeraPulse v1.1*
