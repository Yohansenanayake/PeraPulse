# Diagram 2 — Enterprise Architecture Diagram

> High-level view of actors, organisational roles, platform modules, integration layer, and departmental context. No implementation detail — this represents the business and system-of-systems perspective.

```mermaid
flowchart TD

    %% ── Department Context ──────────────────────────────────────
    subgraph DEPT["Department of Computer Engineering · University of Peradeniya"]

        %% ── Actors ─────────────────────────────────────────────
        subgraph ACTORS["User Roles / Actors"]
            direction LR
            STU("Student\nCurrent undergrad\nAuto: STUDENT role")
            ALU("Alumni\nGraduate\nUpgraded: ALUMNI role")
            ADM("Admin\nFaculty / Staff\nAssigned: ADMIN role")
            SYS("Keycloak IdP\nSystem Actor\nIssues & validates JWT")
        end

        %% ── Client Tier ─────────────────────────────────────────
        subgraph CLIENTS["Client Tier"]
            direction LR
            WEBCL["React Web App\nVite · React 19 · Tailwind · shadcn/ui\nDeployed: Vercel CDN"]
            MOBCL["React Native Mobile App\nExpo · react-navigation\nPlanned: Android & iOS"]
        end

        %% ── Platform Modules ────────────────────────────────────
        subgraph PLATFORM["Platform Modules"]
            direction LR

            subgraph CORE_MOD["Core Modules"]
                direction LR
                M1["Identity &\nAccess Management\nKeycloak · OIDC · PKCE\nRoles: STUDENT · ALUMNI · ADMIN"]
                M2["User &\nProfile Management\nProfiles · Bio · Skills\nRole Upgrade Requests"]
                M3["Social Feed\nText Posts · Likes\nComments · Chronological"]
                M4["Career Hub\nJob & Internship Listings\nApplications · Status Tracking"]
                M5["Events &\nAnnouncements\nCreate Events · RSVP\nAttendee Management"]
            end

            subgraph OPT_MOD["Enhancement Modules"]
                direction LR
                M6["Notification Centre\nIn-App Notifications\nEvent-Driven · Unread Count\nMark Read / Read All"]
                M7["Analytics Dashboard\nUser Metrics · Post Engagement\nJob Application Stats\nAdmin Only"]
            end

            subgraph STRETCH_MOD["Stretch / Planned Modules"]
                direction LR
                M8["Research\nCollaboration\nCreate Projects\nJoin Requests\nDocument Sharing"]
                M9["Direct\nMessaging\nUser-to-User DM\nGroup Channels"]
                M10["Push\nNotifications\nFCM · APNs\nMobile Alerts"]
                M11["Media\nUploads\nImages · Videos\nAzure Blob Storage"]
            end
        end

        %% ── Integration Layer ───────────────────────────────────
        subgraph INTEGRATION["Integration & Cross-Cutting Layer"]
            direction LR
            ICF["Cloudflare\nDNS · Proxy · DDoS Protection\nFull Strict SSL · api.perapulse.org"]
            ING["NGINX Ingress\nController\nRoute: / · /api · /auth"]
            IGW["API Gateway\nSpring Cloud Gateway\nJWT Forward · Rate Limit · CORS"]
            IKF["Kafka Event Bus\nRedpanda · Azure Event Hubs\n4 Topics · 2 Consumer Groups"]
            ICD["GitHub Actions\nCI/CD Pipeline\nBuild · Test · Push · Deploy"]
        end

        %% ── Data & Infrastructure ───────────────────────────────
        subgraph INFRA["Data & Infrastructure Layer"]
            direction LR
            DB["PostgreSQL 16\n7 Databases\nOne per Service"]
            AKS["Azure Kubernetes\nService (AKS)\n2-Node Cluster\nNamespace: perapulse"]
            ACR["Azure Container\nRegistry (ACR)\nDocker Images"]
            BLOB["Azure Blob\nStorage\nMedia Files · CDN"]
        end
    end

    %% ── Actor to Client ─────────────────────────────────────────
    STU & ALU & ADM -->|"Login · Browse · Interact"| WEBCL
    STU & ALU -->|"Login · Browse · Planned"| MOBCL

    %% ── Clients to Integration ──────────────────────────────────
    WEBCL & MOBCL -->|"HTTPS · api.perapulse.org"| ICF
    ICF -->|"Proxied HTTPS\nOrigin CA cert"| ING
    ING -->|"/api/*"| IGW
    ING -->|"/auth/*"| M1

    %% ── Gateway to Modules ──────────────────────────────────────
    IGW -->|"REST · Role-Checked"| M2 & M3 & M4 & M5 & M6 & M7

    %% ── Event-Driven Integration ────────────────────────────────
    M3 & M4 & M5 & M2 ==>|"Publish Domain Events"| IKF
    IKF ==>|"Consume All Topics"| M6
    IKF ==>|"Consume 3 Topics"| M7

    %% ── Module to Infrastructure ────────────────────────────────
    M2 & M3 & M4 & M5 & M6 & M7 --- DB
    AKS --- DB
    ICD -->|"docker push"| ACR
    ICD -->|"kubectl apply"| AKS
    ACR -->|"image pull"| AKS

    %% ── Actor to Module direct (capability lines) ───────────────
    STU -.->|"Apply · RSVP · Post"| M4 & M5 & M3
    ALU -.->|"Post Jobs · Create Events"| M4 & M5
    ADM -.->|"Moderate · Analytics"| M7

    %% ── Styles ──────────────────────────────────────────────────
    classDef actor     fill:#D6EAF8,stroke:#2E86C1,color:#1a1a1a
    classDef client    fill:#AED6F1,stroke:#2874A6,color:#1a1a1a
    classDef coremod   fill:#27AE60,color:#fff,stroke:#1E8449
    classDef optmod    fill:#F39C12,color:#fff,stroke:#D68910
    classDef stretch   fill:#BDC3C7,stroke:#95A5A6,color:#2c2c2c,stroke-dasharray:5 5
    classDef integ     fill:#2E86C1,color:#fff,stroke:#1A5276
    classDef kafka     fill:#E67E22,color:#fff,stroke:#CA6F1E
    classDef infra     fill:#566573,color:#fff,stroke:#2C3E50
    classDef auth      fill:#8E44AD,color:#fff,stroke:#6C3483

    class STU,ALU,ADM,SYS actor
    class WEBCL,MOBCL client
    class M2,M3,M4,M5 coremod
    class M1 auth
    class M6,M7 optmod
    class M8,M9,M10,M11 stretch
    class IGW,ING,ICD,ICF integ
    class IKF kafka
    class DB,AKS,ACR,BLOB infra
```

*Figure 2: Enterprise Architecture of the PeraPulse Department Engagement & Career Platform, showing the three user roles (Student, Alumni, Admin), the client tier, core and enhancement platform modules, Cloudflare-fronted integration layer, and the underlying Azure cloud infrastructure within the Department of Computer Engineering, University of Peradeniya.*

---

## Role–Capability Matrix

| Capability | STUDENT | ALUMNI | ADMIN |
|------------|:-------:|:------:|:-----:|
| View feed, events, opportunities | ✅ | ✅ | ✅ |
| Create / delete own posts | ✅ | ✅ | ✅ |
| Like & comment | ✅ | ✅ | ✅ |
| Apply for jobs / internships | ✅ | ❌ | ✅ |
| Post job / internship listings | ❌ | ✅ | ✅ |
| Create events | ❌ | ✅ | ✅ |
| RSVP to events | ✅ | ✅ | ✅ |
| View event attendees | ❌ | ✅ | ✅ |
| Update application status | ❌ | ✅ | ✅ |
| Request alumni role upgrade | ✅ | N/A | N/A |
| Approve / reject role requests | ❌ | ❌ | ✅ |
| Delete any content (moderation) | ❌ | ❌ | ✅ |
| View analytics dashboard | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## Departmental Workflow

```
1. Student enrols in department
       → registers on PeraPulse (auto STUDENT role via Keycloak)
       → builds profile, engages with feed, applies for opportunities

2. Student graduates
       → submits alumni role-upgrade request
       → Admin reviews & approves
       → Keycloak role updated to ALUMNI
       → alumni can now post jobs, create events, view applications

3. Faculty/Staff
       → assigned ADMIN role manually in Keycloak
       → moderate content, manage users, view platform analytics

4. Alumni connect back
       → post career opportunities for current students
       → share industry knowledge via feed
       → organise networking events with RSVP
```
