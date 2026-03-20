# Diagram 4 — Deployment Diagram: Cloud, Database & Infrastructure

> Shows the full cloud topology (Azure production environment), local development environment (Docker Compose), CI/CD pipeline, and the comparison between the two environments.

## 4A — Production: Azure Cloud Deployment

```mermaid
flowchart TD

    %% ── Internet / Users ────────────────────────────────────────
    subgraph INTERNET["Internet"]
        direction LR
        BR["Web Browser\nHTTPS"]
        APP["Mobile App\nHTTPS · Planned"]
        GH["GitHub Repository\nSource of Truth"]
    end

    %% ── Vercel CDN ──────────────────────────────────────────────
    VERCEL["Vercel CDN\nReact Web SPA\nGlobal Edge Network\nSPA rewrite: /* → /index.html"]

    %% ── Cloudflare ──────────────────────────────────────────────
    subgraph CF["Cloudflare (perapulse.org)"]
        direction LR
        CF_DNS["DNS\nA record: api.perapulse.org\n→ Azure Load Balancer IP"]
        CF_PROXY["Proxy (Orange Cloud)\nCDN · DDoS Protection\nSSL Termination (browser leg)\nFull Strict SSL mode"]
        CF_CERT["Origin CA Certificate\n15-year validity\nTrusted by Cloudflare only\nStored as k8s Secret:\ncloudflare-origin-cert"]
    end

    %% ── Azure Cloud Boundary ────────────────────────────────────
    subgraph AZURE["Microsoft Azure Cloud"]

        %% ── CI/CD Pipeline ──────────────────────────────────────
        subgraph CICD["CI/CD Pipeline"]
            direction LR
            GHA["GitHub Actions\nWorkflow\nTrigger: push to main"]
            ACR["Azure Container\nRegistry (ACR)\nDocker Images\nAll 7 services"]
        end

        %% ── AKS Cluster ─────────────────────────────────────────
        subgraph AKS["Azure Kubernetes Service (AKS) · Namespace: perapulse\n2× Standard_B2als_v2 nodes"]

            %% ── Ingress ─────────────────────────────────────────
            ALB["Azure Load Balancer\nPublic IP\nreceives Cloudflare-proxied traffic"]
            NG["NGINX Ingress Controller\nTLS termination via Origin CA cert\nRoute: /auth → keycloak\nRoute: /api  → api-gateway"]

            %% ── Auth ────────────────────────────────────────────
            KC["Keycloak Pod\nkeycloak:26.5.5\nClusterIP :8080\nRealm: perapulse"]

            %% ── API Gateway ─────────────────────────────────────
            GW["API Gateway Pod\nperapulse/api-gateway\nClusterIP :8080\nJWT Validation · Routing"]

            %% ── Service Pods ────────────────────────────────────
            subgraph PODS["Microservice Pods — ClusterIP · Internal Only"]
                direction LR
                US["user-service\n:8081"]
                FS["feed-service\n:8082"]
                OS["opportunities-service\n:8083"]
                ES["events-service\n:8084"]
                NS["notification-service\n:8085"]
                AN["analytics-service\n:8086"]
            end

            %% ── Config ──────────────────────────────────────────
            subgraph KUBE_CFG["Kubernetes Config"]
                direction LR
                CM["ConfigMaps\nkeycloak-config\nkafka-config"]
                SEC["Secrets\ndb-credentials\nkafka-sasl-config\nkeycloak-admin\ncloudflare-origin-cert"]
            end
        end

        %% ── Azure Managed Services ──────────────────────────────
        subgraph MANAGED["Azure Managed Services"]
            direction LR
            PG["Azure Database for\nPostgreSQL Flexible Server\n7 Databases:\nuser_db · feed_db · opp_db\nevents_db · notif_db\nanalytics_db · keycloak_db"]
            EH["Azure Event Hubs\nKafka-Compatible Endpoint\nSASL/TLS\n4 Topics"]
            BLOB["Azure Blob Storage\nMedia Files\nPost Images · Event Banners\nResume Uploads · CDN URLs"]
        end
    end

    %% ── Request Flow ────────────────────────────────────────────
    BR -->|"HTTPS (web app)"| VERCEL
    BR -->|"HTTPS api.perapulse.org\nTLS leg 1: browser ↔ Cloudflare"| CF_PROXY
    APP -->|"HTTPS api.perapulse.org"| CF_PROXY
    CF_DNS -.->|"A record resolves to\nLoad Balancer IP"| ALB
    CF_PROXY -->|"HTTPS (proxied)\nTLS leg 2: Cloudflare ↔ NGINX\nvia Origin CA cert"| ALB
    CF_CERT -.->|"mounted as TLS secret"| NG

    GH -->|"push to main"| GHA
    GHA -->|"Step 1: Maven build + test\nStep 2: Docker build\nStep 3: docker push"| ACR
    GHA -->|"Step 4: kubectl apply"| AKS

    ACR -->|"image pull on deploy"| PODS

    ALB -->|HTTPS| NG
    NG -->|"/"| VERCEL
    NG -->|"/auth/*"| KC
    NG -->|"/api/*"| GW

    GW <-.->|"JWT validation\nJWKS endpoint"| KC
    GW -->|"REST ClusterIP"| PODS

    %% ── Data connections ────────────────────────────────────────
    PODS -->|"JDBC/TLS"| PG
    KC -->|"JDBC/TLS"| PG

    FS & OS & ES & US ==>|"Kafka PRODUCE\nSASL/TLS"| EH
    EH ==>|"Kafka CONSUME\nnotification-service-cg"| NS
    EH ==>|"Kafka CONSUME\nanalytics-service-cg"| AN

    BR & APP -.->|"HTTPS (media URLs)"| BLOB

    PODS --- KUBE_CFG

    %% ── Styles ──────────────────────────────────────────────────
    classDef user      fill:#D6EAF8,stroke:#2E86C1,color:#1a1a1a
    classDef vercel    fill:#000000,color:#fff,stroke:#333
    classDef cicd      fill:#566573,color:#fff,stroke:#2C3E50
    classDef ingress   fill:#2E86C1,color:#fff,stroke:#1A5276
    classDef keycloak  fill:#8E44AD,color:#fff,stroke:#6C3483
    classDef gateway   fill:#1A5276,color:#fff,stroke:#154360
    classDef service   fill:#27AE60,color:#fff,stroke:#1E8449
    classDef kafka     fill:#E67E22,color:#fff,stroke:#CA6F1E
    classDef managed   fill:#F2F3F4,stroke:#AEB6BF,color:#1a1a1a
    classDef db        fill:#1ABC9C,color:#fff,stroke:#17A589
    classDef config    fill:#FDFEFE,stroke:#AEB6BF,color:#1a1a1a,stroke-dasharray:3 3

    class BR,APP,GH user
    class VERCEL vercel
    class GHA,ACR cicd
    class ALB,NG ingress
    class KC keycloak
    class GW gateway
    class US,FS,OS,ES,NS,AN service
    class EH kafka
    class PG,BLOB managed
    class CM,SEC config
```

*Figure 4a: Production Cloud Deployment Architecture of PeraPulse on Microsoft Azure, showing the Cloudflare DNS and reverse proxy layer (Full Strict SSL with Origin CA certificate), Azure Kubernetes Service cluster internals (NGINX Ingress, API Gateway, seven microservice pods, Kubernetes Secrets and ConfigMaps), and Azure managed services (PostgreSQL Flexible Server, Event Hubs, Blob Storage, Container Registry), with Vercel CDN serving the web frontend and GitHub Actions driving the CI/CD pipeline.*

---

## 4B — Local Development: Docker Compose

```mermaid
flowchart TD

    subgraph LOCAL["Local Development — Docker Compose\nAll containers on bridge network: perapulse-network"]

        subgraph INFRA_LOCAL["Infrastructure Containers"]
            direction LR
            PG_L["perapulse-postgres\npostgres:16-alpine\nhost port: 5433\n7 databases via init.sql"]
            KC_L["perapulse-keycloak\nkeycloak:26.5.5\nhost port: 8180\nRealm imported from JSON"]
            RP["perapulse-redpanda\nredpandadata/redpanda\nKafka API: 9092\n4 topics auto-created"]
            RPC["perapulse-redpanda-console\nredpandadata/console\nhost port: 8888\nKafka UI"]
        end

        subgraph SVCL["Service Containers — local Maven builds"]
            direction LR
            GWL["api-gateway\nhost: 8080"]
            USL["user-service\nhost: 8081"]
            FSL["feed-service\nhost: 8082"]
            OSL["opportunities-service\nhost: 8083"]
            ESL["events-service\nhost: 8084"]
            NSL["notification-service\nhost: 8085"]
            ANL["analytics-service\nhost: 8086"]
        end
    end

    DEV["Developer\nBrowser: localhost:5173\nor localhost:8080"]

    DEV -->|"http://localhost:5173\nor :8080 (gateway test)"| GWL
    DEV -->|"http://localhost:8180/auth/admin\n(Keycloak admin console)"| KC_L
    DEV -->|"http://localhost:8888\n(Redpanda console)"| RPC

    GWL <-.->|"JWKS validation"| KC_L
    GWL --> USL & FSL & OSL & ESL & NSL & ANL

    USL & FSL & OSL & ESL & NSL & ANL -->|"JDBC :5432 (internal)"| PG_L
    KC_L -->|"JDBC :5432 (internal)"| PG_L
    FSL & OSL & ESL & USL ==>|"Kafka :9092"| RP
    RP ==>|"Kafka :9092"| NSL & ANL

    classDef dev      fill:#D6EAF8,stroke:#2E86C1,color:#1a1a1a
    classDef infra    fill:#566573,color:#fff,stroke:#2C3E50
    classDef svc      fill:#27AE60,color:#fff,stroke:#1E8449
    classDef kafka    fill:#E67E22,color:#fff,stroke:#CA6F1E

    class DEV dev
    class PG_L,KC_L,RP,RPC infra
    class GWL,USL,FSL,OSL,ESL,NSL,ANL svc
```

*Figure 4b: Local Development Environment of PeraPulse using Docker Compose, showing all infrastructure containers (PostgreSQL, Keycloak, Redpanda, Redpanda Console) and microservice containers running on a shared bridge network with direct port mappings, using Redpanda as a Kafka-compatible message broker in place of Azure Event Hubs.*

---

## Cloudflare SSL/TLS Architecture

Cloudflare **Full (strict)** SSL mode creates two independent encrypted legs:

```
Browser ──[TLS leg 1: Cloudflare's public cert]──► Cloudflare Proxy
                                                          │
                                         [TLS leg 2: Origin CA cert]
                                                          │
                                                          ▼
                                    Azure Load Balancer → NGINX Ingress
                                    (terminates with cloudflare-origin-cert k8s Secret)
```

| SSL Leg | Certificate | Issued By | Trusted By |
|---------|------------|-----------|------------|
| Browser ↔ Cloudflare | Cloudflare-managed cert | Cloudflare / DigiCert | All browsers |
| Cloudflare ↔ AKS NGINX | Origin CA cert (15-year) | Cloudflare Origin CA | Cloudflare only |

The Origin CA certificate is stored as a Kubernetes TLS secret (`cloudflare-origin-cert`) and referenced in `infra/k8s/ingress/ingress.yaml`. It never needs renewal for the lifetime of the project.

> **Why DNS-only (grey cloud) first?** The deployment guide configures DNS-only initially so that Keycloak's JWT issuer URL (`api.perapulse.org`) resolves correctly before enabling the proxy. The orange cloud (proxy mode) is enabled after Keycloak is healthy.

---

## Environment Comparison

| Component | Local Development | Production (Azure) |
|-----------|------------------|-------------------|
| **Orchestration** | Docker Compose | Azure Kubernetes Service (AKS) |
| **Kafka Broker** | Redpanda (single container) | Azure Event Hubs (managed, Kafka endpoint) |
| **Database** | Single PostgreSQL container (port 5433) | Azure PostgreSQL Flexible Server |
| **Auth** | Keycloak in Docker (port 8180) | Keycloak pod in AKS (ClusterIP :8080) |
| **DNS** | localhost / hosts file | Cloudflare DNS (api.perapulse.org) |
| **CDN / Proxy** | None | Cloudflare Proxy (orange cloud) — DDoS, caching |
| **TLS/HTTPS** | No (HTTP on localhost) | Full (strict): Cloudflare cert + Origin CA cert |
| **Ingress** | Direct port mapping (8080–8086) | NGINX Ingress + Azure Load Balancer |
| **Web Frontend** | Vite dev server (port 5173) | Vercel CDN (global edge) |
| **Media Storage** | Not implemented locally | Azure Blob Storage + CDN |
| **Service Discovery** | Docker DNS (container names) | Kubernetes DNS (ClusterIP services) |
| **Scaling** | Single instance per service | HPA on CPU/memory thresholds |
| **Image Registry** | Local Docker daemon | Azure Container Registry (ACR) |
| **CI/CD** | Manual `mvn spring-boot:run` | GitHub Actions → ACR → AKS |

---

## Scalability Design

| Concern | Current Approach | Scale Path |
|---------|-----------------|-----------|
| **Service instances** | 1 pod per service | Kubernetes HPA (Horizontal Pod Autoscaler) |
| **Database** | Shared PostgreSQL pod | Migrate each DB to Azure PostgreSQL Flexible Server (independent scaling) |
| **Message broker** | Redpanda (dev) → Azure Event Hubs (prod) | Event Hubs partitions scale with throughput |
| **Frontend** | Vercel CDN | Already globally distributed, no changes needed |
| **Auth (Keycloak)** | Single pod | Keycloak HA mode with shared DB or migrate to Azure AD B2C |
| **Statelessness** | All services are JWT-stateless | Horizontal scale with no session affinity required |
| **Media storage** | Azure Blob + CDN | Azure CDN scales automatically |

---

## Local Dev Access Points

```
http://localhost:8080           → API Gateway (all API routes)
http://localhost:8180/auth      → Keycloak (via direct access)
http://localhost:8180/auth/admin → Keycloak Admin Console
http://localhost:8888           → Redpanda Console (Kafka UI)
http://localhost:5173           → React Web App (Vite dev server)
http://localhost:8081/swagger-ui.html → User Service Swagger
http://localhost:8082/swagger-ui.html → Feed Service Swagger
http://localhost:8083/swagger-ui.html → Opportunities Service Swagger
http://localhost:8084/swagger-ui.html → Events Service Swagger
http://localhost:8085/swagger-ui.html → Notification Service Swagger
http://localhost:8086/swagger-ui.html → Analytics Service Swagger
```
