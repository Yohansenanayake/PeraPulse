# PeraPulse

**Department Engagement & Career Platform** — CO528 Applied Software Architecture Mini Project
University of Peradeniya, Department of Computer Engineering

---

## Overview

PeraPulse connects current students and alumni of the Department of Computer Engineering through a unified platform for social engagement, career opportunities, and departmental events.

| Module | Features |
|--------|---------|
| Social Feed | Posts, comments, likes |
| Career Hub | Post and apply for jobs & internships |
| Events | Department events with RSVP |
| Notifications | Event-driven in-app alerts |
| Analytics | Admin dashboard with platform metrics |
| Identity & Access | Student / Alumni / Admin roles via Keycloak |

---

## Architecture

### SOA Diagram — Service Interactions & API Endpoints

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

    subgraph DBS["PostgreSQL 16 — Database per Service"]
        direction LR
        UDB[("user_db")]
        FDB[("feed_db")]
        ODB[("opp_db")]
        EDB[("events_db")]
        NDB[("notif_db")]
        ADB[("analytics_db")]
    end

    WEB & MOB -->|HTTPS| NG
    NG -->|"/api/*"| GW
    NG -->|"/auth/*"| KC
    GW <-.->|"JWT Validation\nJWKS Endpoint"| KC
    GW -->|"/api/profiles/*\n/api/admin/*"| US
    GW -->|"/api/posts/*\n/api/comments/*"| FS
    GW -->|"/api/opportunities/*\n/api/applications/*"| OS
    GW -->|"/api/events/*\n/api/rsvps/*"| ES
    GW -->|"/api/notifications/*"| NS
    GW -->|"/api/analytics/*"| AN
    FS -.->|"Internal Sync\nOpenFeign\nProfile Enrichment"| US
    US --- UDB
    FS --- FDB
    OS --- ODB
    ES --- EDB
    NS --- NDB
    AN --- ADB
    FS ==>|"PRODUCE"| T1
    OS ==>|"PRODUCE"| T2
    ES ==>|"PRODUCE"| T3
    US ==>|"PRODUCE"| T4
    T1 & T2 & T3 & T4 ==>|"CONSUME\nAll 4 Topics"| NS
    T1 & T2 & T3 ==>|"CONSUME\n3 Topics"| AN

    classDef client    fill:#D6EAF8,stroke:#2E86C1,color:#1a1a1a
    classDef edge      fill:#2E86C1,color:#fff,stroke:#1A5276
    classDef gateway   fill:#1A5276,color:#fff,stroke:#154360
    classDef keycloak  fill:#8E44AD,color:#fff,stroke:#6C3483
    classDef core      fill:#27AE60,color:#fff,stroke:#1E8449
    classDef kafka     fill:#E67E22,color:#fff,stroke:#CA6F1E
    classDef support   fill:#F39C12,color:#fff,stroke:#D68910
    classDef db        fill:#1ABC9C,color:#fff,stroke:#17A589

    class WEB,MOB client
    class NG edge
    class GW gateway
    class KC keycloak
    class US,FS,OS,ES core
    class T1,T2,T3,T4 kafka
    class NS,AN support
    class UDB,FDB,ODB,EDB,NDB,ADB db
```

*Figure 1: Service-Oriented Architecture of PeraPulse, illustrating the seven microservices, synchronous REST communication via the API Gateway, asynchronous event-driven integration over the Kafka message bus, internal OpenFeign service-to-service calls, and the database-per-service deployment pattern.*

---

### Deployment Diagram — Cloud & Infrastructure

```mermaid
flowchart TD
    subgraph INTERNET["Internet"]
        direction LR
        BR["Web Browser\nHTTPS"]
        APP["Mobile App\nHTTPS · Planned"]
        GH["GitHub Repository\nSource of Truth"]
    end

    VERCEL["Vercel CDN\nReact Web SPA\nGlobal Edge Network"]

    subgraph CF["Cloudflare (perapulse.org)"]
        direction LR
        CF_DNS["DNS\nA record: api.perapulse.org\n→ Azure Load Balancer IP"]
        CF_PROXY["Proxy (Orange Cloud)\nCDN · DDoS Protection\nFull Strict SSL mode"]
        CF_CERT["Origin CA Certificate\n15-year validity\nk8s Secret: cloudflare-origin-cert"]
    end

    subgraph AZURE["Microsoft Azure Cloud"]
        subgraph CICD["CI/CD Pipeline"]
            direction LR
            GHA["GitHub Actions\nWorkflow"]
            ACR["Azure Container Registry\nDocker Images · All 7 services"]
        end

        subgraph AKS["Azure Kubernetes Service (AKS) · Namespace: perapulse\n2× Standard_B2als_v2 nodes"]
            ALB["Azure Load Balancer\nPublic IP"]
            NG["NGINX Ingress Controller\nTLS via Origin CA cert\n/auth → keycloak · /api → api-gateway"]
            KC["Keycloak Pod\nClusterIP :8080"]
            GW["API Gateway Pod\nClusterIP :8080\nJWT Validation · Routing"]
            subgraph PODS["Microservice Pods — ClusterIP"]
                direction LR
                US["user-service :8081"]
                FS["feed-service :8082"]
                OS["opportunities-service :8083"]
                ES["events-service :8084"]
                NS["notification-service :8085"]
                AN["analytics-service :8086"]
            end
        end

        subgraph MANAGED["Azure Managed Services"]
            direction LR
            PG["Azure PostgreSQL\nFlexible Server\n7 Databases"]
            EH["Azure Event Hubs\nKafka Endpoint · 4 Topics"]
            BLOB["Azure Blob Storage\nMedia Files · CDN"]
        end
    end

    BR -->|"HTTPS (web app)"| VERCEL
    BR -->|"HTTPS api.perapulse.org\nTLS leg 1: browser ↔ Cloudflare"| CF_PROXY
    APP -->|"HTTPS api.perapulse.org"| CF_PROXY
    CF_DNS -.->|"A record → Load Balancer IP"| ALB
    CF_PROXY -->|"HTTPS proxied\nTLS leg 2: Cloudflare ↔ NGINX\nvia Origin CA cert"| ALB
    CF_CERT -.->|"mounted as TLS secret"| NG
    GH -->|"push to main"| GHA
    GHA -->|"Maven build · Docker build · docker push"| ACR
    GHA -->|"kubectl apply"| AKS
    ACR -->|"image pull"| PODS
    ALB --> NG
    NG -->|"/auth/*"| KC
    NG -->|"/api/*"| GW
    GW <-.->|"JWT / JWKS"| KC
    GW -->|"REST ClusterIP"| PODS
    PODS -->|"JDBC/TLS"| PG
    KC -->|"JDBC/TLS"| PG
    FS & OS & ES & US ==>|"Kafka PRODUCE"| EH
    EH ==>|"Kafka CONSUME"| NS & AN

    classDef user     fill:#D6EAF8,stroke:#2E86C1,color:#1a1a1a
    classDef cf       fill:#F6821F,color:#fff,stroke:#c96a18
    classDef cicd     fill:#566573,color:#fff,stroke:#2C3E50
    classDef ingress  fill:#2E86C1,color:#fff,stroke:#1A5276
    classDef keycloak fill:#8E44AD,color:#fff,stroke:#6C3483
    classDef gateway  fill:#1A5276,color:#fff,stroke:#154360
    classDef service  fill:#27AE60,color:#fff,stroke:#1E8449
    classDef kafka    fill:#E67E22,color:#fff,stroke:#CA6F1E
    classDef managed  fill:#F2F3F4,stroke:#AEB6BF,color:#1a1a1a

    class BR,APP,GH user
    class CF_DNS,CF_PROXY,CF_CERT cf
    class GHA,ACR cicd
    class ALB,NG ingress
    class KC keycloak
    class GW gateway
    class US,FS,OS,ES,NS,AN service
    class EH kafka
    class PG,BLOB,VERCEL managed
```

*Figure 4a: Production Cloud Deployment Architecture of PeraPulse on Microsoft Azure, showing the Cloudflare DNS and reverse proxy layer (Full Strict SSL with Origin CA certificate), Azure Kubernetes Service cluster internals (NGINX Ingress, API Gateway, seven microservice pods), and Azure managed services (PostgreSQL Flexible Server, Event Hubs, Blob Storage, Container Registry), with Vercel CDN serving the web frontend and GitHub Actions driving the CI/CD pipeline.*

> Full diagram set (Enterprise Architecture, Product Modularity, Local Dev environment): [`docs/architecture/diagrams/`](docs/architecture/diagrams/)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 21 · Spring Boot 3/4 · Spring Cloud Gateway · Spring Security |
| **Frontend (Web)** | React 19 · Vite · Zustand · TanStack Query · shadcn/ui · Tailwind CSS |
| **Frontend (Mobile)** | React Native · Expo (planned) |
| **Auth** | Keycloak 26.x · OIDC · Authorization Code + PKCE |
| **Database** | PostgreSQL 16 · Flyway migrations · Database-per-service |
| **Messaging** | Redpanda (local) · Azure Event Hubs — Kafka endpoint (prod) |
| **Cloud** | Azure Kubernetes Service · Azure PostgreSQL · Azure Blob Storage · ACR |
| **DNS / Proxy** | Cloudflare DNS · Proxy · Full Strict SSL · Origin CA |
| **Web Deployment** | Vercel CDN |
| **CI/CD** | GitHub Actions |
| **API Contracts** | OpenAPI 3.0 · Swagger UI per service |

---

## Repository Structure

```
PeraPulse/
├── services/                    # Spring Boot microservices (Java 21 · Maven)
│   ├── api-gateway/             # Spring Cloud Gateway · JWT validation · routing
│   ├── user-service/            # Profiles · role requests · admin
│   ├── feed-service/            # Posts · comments · likes · Kafka producer
│   ├── opportunities-service/   # Jobs & internships · applications · Kafka producer
│   ├── events-service/          # Events · RSVP · Kafka producer
│   ├── notification-service/    # In-app notifications · Kafka consumer
│   └── analytics-service/       # Platform metrics · admin dashboard · Kafka consumer
├── clients/
│   ├── perapulse-web/           # React 19 + Vite SPA · deployed on Vercel
│   └── mobile/                  # React Native + Expo (planned)
├── infra/
│   ├── k8s/                     # Kubernetes manifests (AKS · namespace: perapulse)
│   ├── docker-compose.yml       # Full local dev stack
│   ├── postgres/init.sql        # Creates 7 databases
│   └── keycloak/                # Realm export (perapulse-realm.json)
├── docs/
│   ├── api/                     # OpenAPI 3.0 YAML specs (one per service)
│   ├── architecture/
│   │   ├── diagrams/            # Mermaid architecture diagrams (Figures 1–4)
│   │   └── aks-deployment-guide.md
│   └── brainstorm/              # Project proposal · report guide · design notes
└── .github/workflows/           # GitHub Actions CI/CD
```

---

## Local Development

### Prerequisites

- Docker + Docker Compose
- Java 21 (Eclipse Temurin recommended)
- Node.js 20+
- Maven 3.9+ (or use the `./mvnw` wrapper in each service)

### 1. Start infrastructure

```bash
docker-compose -f infra/docker-compose.yml up -d
```

Starts: PostgreSQL (port 5433), Keycloak (port 8180), Redpanda (port 9092), Redpanda Console (port 8888)

### 2. Run services

```bash
# From each service directory, e.g.:
cd services/api-gateway && ./mvnw spring-boot:run
```

### 3. Run web client

```bash
cd clients/perapulse-web && npm install && npm run dev
```

### Local access points

| Endpoint | URL |
|----------|-----|
| React Web App | `http://localhost:5173` |
| API Gateway | `http://localhost:8080` |
| Keycloak Admin | `http://localhost:8180/auth/admin` |
| Redpanda Console | `http://localhost:8888` |
| Swagger UI (per service) | `http://localhost:{PORT}/swagger-ui.html` |

---

## Cloud Deployment

- **Domain:** `api.perapulse.org` (Cloudflare DNS + Proxy · Full Strict SSL)
- **Platform:** Azure Kubernetes Service (AKS) · namespace `perapulse`
- **Nodes:** 2× `Standard_B2als_v2`
- **Database:** Azure Database for PostgreSQL Flexible Server (7 databases)
- **Messaging:** Azure Event Hubs (Kafka-compatible endpoint · 4 topics)
- **Registry:** Azure Container Registry (ACR)
- **Media Storage:** Azure Blob Storage
- **Web Frontend:** Vercel CDN

Full step-by-step deployment guide: [`docs/architecture/aks-deployment-guide.md`](docs/architecture/aks-deployment-guide.md)

---

## API Documentation

OpenAPI 3.0 specs in [`docs/api/`](docs/api/). Each service also exposes Swagger UI at `/swagger-ui.html` when running locally.

| Service | Spec | Key Endpoints |
|---------|------|---------------|
| User Service | [user-service.yaml](docs/api/user-service.yaml) | `/api/profiles/*` · `/api/admin/*` |
| Feed Service | [feed-service.yaml](docs/api/feed-service.yaml) | `/api/posts/*` · `/api/comments/*` |
| Opportunities | [opportunities-service.yaml](docs/api/opportunities-service.yaml) | `/api/opportunities/*` · `/api/applications/*` |
| Events | [events-service.yaml](docs/api/events-service.yaml) | `/api/events/*` · `/api/rsvps/*` |
| Notifications | [notification-service.yaml](docs/api/notification-service.yaml) | `/api/notifications/*` |
| Analytics | [analytics-service.yaml](docs/api/analytics-service.yaml) | `/api/analytics/*` |

---

## Architecture Diagrams

Full Mermaid diagrams with captions in [`docs/architecture/diagrams/`](docs/architecture/diagrams/):

| Figure | Diagram | File |
|--------|---------|------|
| Figure 1 | SOA — Service Interactions & API Endpoints | [01_soa_diagram.md](docs/architecture/diagrams/01_soa_diagram.md) |
| Figure 2 | Enterprise Architecture | [02_enterprise_diagram.md](docs/architecture/diagrams/02_enterprise_diagram.md) |
| Figure 3 | Product Modularity | [03_product_modularity_diagram.md](docs/architecture/diagrams/03_product_modularity_diagram.md) |
| Figure 4a | Deployment — Azure Production | [04_deployment_diagram.md](docs/architecture/diagrams/04_deployment_diagram.md) |
| Figure 4b | Deployment — Local Development | [04_deployment_diagram.md](docs/architecture/diagrams/04_deployment_diagram.md) |

---

## Team Roles

| Role | Responsibility |
|------|---------------|
| Enterprise Architect | High-level system vision, module integration, departmental workflow |
| Solution Architect | Service design, API contracts, inter-service communication |
| Application Architect | Feature implementation, client integration, code quality |
| Security Architect | Auth design (Keycloak/OIDC), JWT flow, role-based access |
| DevOps Architect | CI/CD pipeline, AKS deployment, Cloudflare, cloud infrastructure |

---

## Documentation

| Document | Location |
|----------|---------|
| Report Guide & Task Breakdown | [docs/brainstorm/report_guide.md](docs/brainstorm/report_guide.md) |
| Project Proposal & Sprint Plan | [docs/brainstorm/project_proposal.md](docs/brainstorm/project_proposal.md) |
| AKS Deployment Guide | [docs/architecture/aks-deployment-guide.md](docs/architecture/aks-deployment-guide.md) |
| Architecture Diagram Sketches | [docs/architecture/architecture_diagram_sketches.md](docs/architecture/architecture_diagram_sketches.md) |
| Architecture Diagrams (Mermaid) | [docs/architecture/diagrams/](docs/architecture/diagrams/) |
| OpenAPI Specs | [docs/api/](docs/api/) |
