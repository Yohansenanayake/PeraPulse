# PeraPulse

**Department Engagement & Career Platform** — CO528 Applied Software Architecture Mini Project  
University of Peradeniya, Department of Computer Engineering

---

## Overview

PeraPulse connects students and alumni through:
- 📰 **Social Feed** — posts, comments, likes
- 💼 **Jobs & Internships** — post and apply for opportunities
- 📅 **Events** — department events with RSVP
- 🔔 **Notifications** — event-driven in-app alerts
- 📊 **Analytics** — admin dashboard
- 🎓 **Alumni Role Requests** — students request alumni status, admin approves

## Architecture

Microservices (Spring Boot 3 / Java 21) + React Web + React Native Mobile  
Auth: Keycloak (self-hosted, OIDC / PKCE)  
Async: Kafka (Redpanda local, Azure Event Hubs cloud)  
Cloud: Azure Kubernetes Service (AKS)

## Repository Structure

```
PeraPulse/
├── services/               # Spring Boot microservices
│   ├── user-service/
│   ├── feed-service/
│   ├── opportunities-service/
│   ├── events-service/
│   ├── notification-service/
│   ├── analytics-service/
│   └── api-gateway/
├── clients/
│   ├── web/                # React + Vite SPA
│   └── mobile/             # React Native (Expo)
├── infra/
│   ├── k8s/                # Kubernetes manifests
│   ├── docker-compose.yml  # Local dev stack
│   └── keycloak/           # Realm export
├── docs/
│   ├── api/                # OpenAPI specs (spec-first)
│   ├── architecture/       # Architecture diagrams
│   ├── brainstorm/         # Proposal & design notes
│   └── research/           # Platform research findings
└── .github/workflows/      # CI/CD GitHub Actions
```

## Local Development

### Prerequisites
- Docker + Docker Compose
- Java 21
- Node.js 20+

### Start local stack
```bash
docker-compose -f infra/docker-compose.yml up -d
```

This starts: PostgreSQL, Keycloak, Redpanda, Redpanda Console

### Services (local ports)
| Service | Port |
|---|---|
| API Gateway | 8080 |
| User Service | 8081 |
| Feed Service | 8082 |
| Opportunities Service | 8083 |
| Events Service | 8084 |
| Notification Service | 8085 |
| Analytics Service | 8086 |
| Keycloak | 8180 |
| Redpanda Console | 8082 |

### OpenAPI / Swagger UI
Each service exposes Swagger UI at `/swagger-ui.html` when running locally.  
Spec-first YAML files are in `docs/api/`.

## Cloud Deployment

- **Platform:** Azure Kubernetes Service (AKS)
- **Namespace:** `perapulse`
- **Database:** Azure Database for PostgreSQL Flexible Server
- **Messaging:** Azure Event Hubs (Kafka endpoint, 4 topics)
- **Registry:** Azure Container Registry (ACR)
- **Storage:** Azure Blob Storage (media)

## Documentation

- [Project Proposal & MVP Breakdown](docs/brainstorm/project_proposal.md)
- [API Specs](docs/api/)
- [Architecture Diagrams](docs/architecture/)

## Team Roles

| Role | Owner |
|---|---|
| Enterprise Architect | TBD |
| Solution Architect | TBD |
| Application Architect | TBD |
| Security Architect | TBD |
| DevOps Architect | TBD |
