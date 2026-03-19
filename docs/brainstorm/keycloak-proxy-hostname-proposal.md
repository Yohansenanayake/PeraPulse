# PeraPulse Keycloak Reverse Proxy / Hostname Alignment Proposal

## Objective

Fix the current Keycloak public URL mismatch so that:

- Keycloak discovery metadata publishes URLs under `/auth`
- the admin console works reliably through the public domain
- Spring services validate JWTs against the correct issuer
- the API Gateway and Keycloak use one consistent path strategy

---

## Current Situation

The current deployment mixes **relative-path mode** and **root hostname mode**:

- `keycloak.yaml` sets `KC_HTTP_RELATIVE_PATH=/auth`, `KC_HTTP_MANAGEMENT_RELATIVE_PATH=/`, and `KC_HOSTNAME=https://api.perapulse.org`
- `app-config.yaml` expects the public issuer to be `https://api.perapulse.org/auth/realms/perapulse`
- `GatewayRoutesConfig.java` forwards `/auth/**` to Keycloak **without stripping `/auth`**

This combination is close, but not fully aligned. In practice, Keycloak is reachable at `/auth/...`, yet it has been publishing some metadata URLs without the `/auth` prefix.

---

## Root Cause

Keycloak supports **two valid reverse-proxy patterns** for exposing it at `/auth`:

1. **Relative-path mode**
   - Keycloak itself runs under `/auth`
   - Reverse proxy forwards `/auth/...` unchanged

2. **Full external URL mode**
   - Keycloak runs internally at root `/`
   - External proxy exposes it at `/auth`
   - Proxy must strip `/auth` before forwarding to Keycloak

Right now the project is using gateway routing behavior that matches **relative-path mode**, but the hostname/discovery behavior is not fully aligned with that choice.

---

## Recommended Option

## Option A — Keep Relative-Path Mode (recommended for lowest risk)

### Why this is recommended

This is the **lowest-risk** option because it preserves the existing gateway behavior:

- `/auth/**` is already forwarded unchanged to Keycloak
- internal services already use an internal JWK URL with `/auth/...`
- fewer moving parts need to change
- no API Gateway code rebuild is required

### Target design

- Keycloak remains mounted internally at `/auth`
- API Gateway continues forwarding `/auth/**` unchanged
- public issuer remains `https://api.perapulse.org/auth/realms/perapulse`
- management endpoints remain on port `9000` and root path `/health/...`

### Proposed configuration

#### `keycloak.yaml`

Keep this shape:

```yaml
- name: KC_HTTP_RELATIVE_PATH
  value: "/auth"
- name: KC_HTTP_MANAGEMENT_RELATIVE_PATH
  value: "/"
- name: KC_PROXY_HEADERS
  value: "xforwarded"
- name: KC_HOSTNAME
  value: "https://api.perapulse.org"
- name: KC_HEALTH_ENABLED
  value: "true"
```

Readiness probe:

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 9000
```

### Why this works

- Keycloak app endpoints stay under `/auth/...`
- management endpoints stay under `/health/...` on port `9000`
- the gateway can continue forwarding `/auth/**` unchanged
- the internal JWK endpoint in `app-config.yaml` can stay as:

```yaml
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI: "http://keycloak:8080/auth/realms/perapulse/protocol/openid-connect/certs"
```

### What to verify after applying

1. `curl https://api.perapulse.org/auth/realms/perapulse`
2. confirm returned metadata URLs also contain `/auth/...`
3. open `https://api.perapulse.org/auth/admin/`
4. confirm admin console redirects remain under `/auth/...`

---

## Alternative Option

## Option B — Full External URL + Gateway Rewrite (cleaner architecture)

### Why consider it

This is the **cleaner architectural option** because the API Gateway becomes the single place that owns the public `/auth` prefix.

In this design:

- Keycloak runs internally at root `/`
- the external public URL is still `https://api.perapulse.org/auth`
- the API Gateway strips `/auth` before forwarding requests to Keycloak

### Benefits

- cleaner separation between internal app path and public proxy path
- avoids teaching internal Keycloak paths, discovery, and proxy routing all about `/auth`
- aligns well with a gateway-centric architecture

### Required changes

#### `keycloak.yaml`

Use:

```yaml
- name: KC_PROXY_HEADERS
  value: "xforwarded"
- name: KC_HOSTNAME
  value: "https://api.perapulse.org/auth"
- name: KC_HEALTH_ENABLED
  value: "true"
```

Remove:

```yaml
- name: KC_HTTP_RELATIVE_PATH
  value: "/auth"
- name: KC_HTTP_MANAGEMENT_RELATIVE_PATH
  value: "/"
```

#### `GatewayRoutesConfig.java`

Change the Keycloak route to strip the `/auth` prefix:

```java
.route("keycloak", route -> route
    .path("/auth/**")
    .filters(filters -> filters
        .preserveHostHeader()
        .stripPrefix(1))
    .uri(keycloakInternalUrl))
```

#### `app-config.yaml`

Keep public issuer:

```yaml
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI: "https://api.perapulse.org/auth/realms/perapulse"
```

Change internal JWK URI to remove `/auth`:

```yaml
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI: "http://keycloak:8080/realms/perapulse/protocol/openid-connect/certs"
```

### Risks / costs

- requires rebuilding and redeploying `api-gateway`
- more moving parts change at once
- temporary rollout mistakes can break auth until all three pieces are aligned

---

## Comparison

| Item | Option A: Relative-path mode | Option B: Full URL + rewrite |
|---|---|---|
| Gateway code changes | No | Yes |
| Keycloak internal path | `/auth` | `/` |
| Public path | `/auth` | `/auth` |
| Internal JWK URL | includes `/auth` | root `/realms/...` |
| Operational risk now | Lower | Higher |
| Long-term neatness | Good | Better |
| Best fit right now | **Yes** | Possible, but later |

---

## Recommendation

For the current AKS mini-project deployment, adopt:

> **Option A — Keep Relative-Path Mode**

### Rationale

- it fits the current API Gateway behavior
- it minimizes disruption to working services
- it does not require rebuilding the gateway
- it is the fastest path to a working admin console and correct issuer setup

Option B is still a valid future refactor after the current deployment is stable.

---

## Proposed Implementation Plan

### Step 1
Confirm `keycloak.yaml` uses:

```yaml
KC_HTTP_RELATIVE_PATH=/auth
KC_HTTP_MANAGEMENT_RELATIVE_PATH=/
KC_PROXY_HEADERS=xforwarded
KC_HOSTNAME=https://api.perapulse.org
KC_HEALTH_ENABLED=true
```

### Step 2
Keep `app-config.yaml` as:

```yaml
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=https://api.perapulse.org/auth/realms/perapulse
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI=http://keycloak:8080/auth/realms/perapulse/protocol/openid-connect/certs
```

### Step 3
Keep Gateway route unchanged for now:

```java
.path("/auth/**")
.filters(filters -> filters.preserveHostHeader())
.uri(keycloakInternalUrl)
```

### Step 4
Apply / restart:

```bash
kubectl apply -f infra/k8s/deployments/keycloak.yaml
kubectl apply -f infra/k8s/configmaps/app-config.yaml
kubectl rollout restart deployment/keycloak -n perapulse
kubectl rollout restart deployment/api-gateway -n perapulse
```

### Step 5
Validate:

```bash
curl https://api.perapulse.org/auth/realms/perapulse
curl -I https://api.perapulse.org/auth/admin/
```

Success criteria:

- discovery metadata URLs include `/auth`
- admin console stays under `/auth/admin/...`
- JWT issuer seen in tokens matches `/auth/realms/perapulse`

---

## Final Note

Both options are valid. The real issue is not that one option is universally right and the other is wrong; the issue is that **all participating components must follow the same model at the same time**:

- Keycloak hostname model
- Keycloak internal path model
- API Gateway route behavior
- Spring issuer and JWK URIs

The recommendation is to stabilize the deployment first with **Option A**, then revisit Option B later if a cleaner gateway-owned path strategy is desired.
