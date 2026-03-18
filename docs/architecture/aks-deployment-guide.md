# PeraPulse — Azure AKS Deployment Guide

> **Goal:** Deploy the full PeraPulse backend to Azure Kubernetes Service with minimal setup.
> Security is not the first priority. This guide keeps everything in-cluster (no managed PaaS services) to minimise cost and configuration steps.

---

## Architecture Overview

```
Internet
   │
   ▼
Azure Load Balancer  (single public IP)
   │
NGINX Ingress Controller
   │
api-gateway (ClusterIP :8080)
   ├── /auth/**          → keycloak:8080
   ├── /api/users/**     → user-service:8081
   ├── /api/profiles/**  → user-service:8081
   └── /api/admin/**     → user-service:8081
   (more routes to be added as services are implemented)

In-cluster services (ClusterIP, not reachable from outside):
  postgres:5432      — shared PostgreSQL instance (7 databases)
  redpanda:9092      — Kafka-compatible message bus
  keycloak:8080      — OIDC identity provider
  user-service:8081
  feed-service:8082
  opportunities-service:8083
  events-service:8084
  notification-service:8085
  analytics-service:8086
```

Estimated cost: **~$60–80/month** (2× Standard_B2s nodes + 10 Gi managed disk).

---

## Prerequisites

| Tool | Minimum version | Install |
|------|----------------|---------|
| Azure CLI | 2.50+ | `winget install Microsoft.AzureCLI` / [docs.microsoft.com](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) |
| kubectl | 1.29+ | `az aks install-cli` |
| Helm | 3.14+ | [helm.sh](https://helm.sh/docs/intro/install/) |
| Docker | 24+ | [docker.com](https://docs.docker.com/get-docker/) |

```bash
az login
az account set --subscription "<your-subscription-id>"
```

---

## Step 1 — Create Azure Resources

```bash
# ── Variables — change ACR_NAME, it must be globally unique ─────────────
RESOURCE_GROUP=perapulse-rg
LOCATION=southeastasia
ACR_NAME=perapulseacr       # must be 5-50 alphanumeric chars, globally unique
AKS_CLUSTER=perapulse-aks

# ── Resource group ───────────────────────────────────────────────────────
az group create --name $RESOURCE_GROUP --location $LOCATION

# ── Azure Container Registry ─────────────────────────────────────────────
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic

# ── AKS cluster (2 nodes, attaches ACR so no imagePullSecrets needed) ───
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER \
  --node-count 2 \
  --node-vm-size standard_b2als_v2 \
  --attach-acr $ACR_NAME \
  --generate-ssh-keys

# ── Merge kubeconfig ─────────────────────────────────────────────────────
az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_CLUSTER

# Verify connectivity
kubectl get nodes
```

---

## Step 2 — Install NGINX Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=1

# Wait for the external IP to be assigned (can take 2–3 minutes)
kubectl get svc -n ingress-nginx ingress-nginx-controller --watch
```

Once `EXTERNAL-IP` shows a real IP address, save it:

```bash
PUBLIC_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Public IP: $PUBLIC_IP"
```

---

## Step 2b — Point perapulse.org DNS to the Cluster (Cloudflare)

1. Log in to [Cloudflare dashboard](https://dash.cloudflare.com) → select **perapulse.org**
2. Go to **DNS → Records → Add record**
3. Add the following A record:

   | Type | Name | Content | Proxy status | TTL |
   |------|------|---------|--------------|-----|
   | A | `api` | `<value of $PUBLIC_IP>` | **DNS only** (grey cloud) | Auto |

   > **Why DNS only (grey cloud)?** Cloudflare's proxy mode rewrites headers and may break Keycloak's JWT issuer URL validation. Use the grey cloud for a plain backend deployment.

4. Save. DNS propagation is typically instant with Cloudflare but may take up to a few minutes globally.
5. Verify:
   ```bash
   nslookup api.perapulse.org
   # Should resolve to your $PUBLIC_IP
   ```

> **Domain is already baked into the manifests** — `api.perapulse.org` is hardcoded in
> `infra/k8s/configmaps/app-config.yaml`, `infra/k8s/deployments/keycloak.yaml`, and
> `infra/k8s/ingress/ingress.yaml`. No manual IP patching is needed for these files.

---

## Step 3 — Build and Push Docker Images

Run these commands from the **repository root** (`PeraPulse/`).

```bash
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
az acr login --name $ACR_NAME

for svc in api-gateway user-service feed-service opportunities-service \
           events-service notification-service analytics-service; do
  echo "▶ Building $svc..."
  docker build -t $ACR_LOGIN_SERVER/perapulse/$svc:latest ./services/$svc
  docker push $ACR_LOGIN_SERVER/perapulse/$svc:latest
done

echo "All images pushed to $ACR_LOGIN_SERVER"
```

> **Tip:** Builds take 5–10 minutes each on first run (Maven dependency download).
> Subsequent builds are faster because the Docker layer cache is reused.

---

## Step 4 — Patch Image Names in Manifests

The deployment manifests use the placeholder `<ACR_LOGIN_SERVER>`. Replace it:

```bash
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

# Linux / macOS
find infra/k8s/deployments -name "*.yaml" -exec \
  sed -i "s|<ACR_LOGIN_SERVER>|$ACR_LOGIN_SERVER|g" {} +

# Windows (PowerShell)
Get-ChildItem infra/k8s/deployments/*.yaml | ForEach-Object {
  (Get-Content $_.FullName) -replace '<ACR_LOGIN_SERVER>', $env:ACR_LOGIN_SERVER |
  Set-Content $_.FullName
}
```

---

## Step 5 — Create the Keycloak Realm ConfigMap

The realm JSON is too large to embed in a YAML file directly. Create it from the file:

```bash
kubectl create namespace perapulse --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap keycloak-realm \
  --from-file=perapulse-realm.json=infra/keycloak/perapulse-realm.json \
  --namespace perapulse
```

> **If you update `perapulse-realm.json`** (e.g. adding redirect URIs) after Keycloak is already running,
> the ConfigMap and pod must be refreshed — Keycloak only imports the realm on first startup:
> ```bash
> kubectl delete configmap keycloak-realm -n perapulse
> kubectl create configmap keycloak-realm \
>   --from-file=perapulse-realm.json=infra/keycloak/perapulse-realm.json \
>   --namespace perapulse
> kubectl rollout restart deployment/keycloak -n perapulse
> ```

---

## Step 6 — Apply All Manifests

Apply in dependency order:

```bash
# Namespace
kubectl apply -f infra/k8s/namespace.yaml

# Secrets and ConfigMaps
kubectl apply -f infra/k8s/secrets/
kubectl apply -f infra/k8s/configmaps/

# Infrastructure: PostgreSQL first, then Redpanda, then Keycloak
kubectl apply -f infra/k8s/deployments/postgres.yaml

echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres \
  -n perapulse --timeout=120s

kubectl apply -f infra/k8s/deployments/redpanda.yaml

echo "Waiting for Redpanda to be ready..."
kubectl wait --for=condition=ready pod -l app=redpanda \
  -n perapulse --timeout=120s

kubectl apply -f infra/k8s/deployments/keycloak.yaml

echo "Waiting for Keycloak to be ready (this can take ~2 minutes)..."
kubectl wait --for=condition=ready pod -l app=keycloak \
  -n perapulse --timeout=180s

# Microservices
kubectl apply -f infra/k8s/deployments/user-service.yaml
kubectl apply -f infra/k8s/deployments/feed-service.yaml
kubectl apply -f infra/k8s/deployments/opportunities-service.yaml
kubectl apply -f infra/k8s/deployments/events-service.yaml
kubectl apply -f infra/k8s/deployments/notification-service.yaml
kubectl apply -f infra/k8s/deployments/analytics-service.yaml
kubectl apply -f infra/k8s/deployments/api-gateway.yaml

# Ingress
kubectl apply -f infra/k8s/ingress/ingress.yaml

echo "Done. Check pod status:"
kubectl get pods -n perapulse
```

---

## Step 7 — Verify the Deployment

```bash
# All pods should be Running
kubectl get pods -n perapulse

# Services
kubectl get svc -n perapulse

# Gateway health
curl http://api.perapulse.org/actuator/health

# Keycloak realm (proxied through gateway)
curl http://api.perapulse.org/auth/realms/perapulse

# Pod logs (example)
kubectl logs -n perapulse deployment/api-gateway --tail=50
kubectl logs -n perapulse deployment/user-service --tail=50
kubectl logs -n perapulse deployment/keycloak --tail=50
```

Expected responses:
- `GET /actuator/health` → `{"status":"UP"}`
- `GET /auth/realms/perapulse` → JSON with `"realm": "perapulse"`

---

## Troubleshooting

### Pod stuck in `Pending`
```bash
kubectl describe pod <pod-name> -n perapulse
# Look for "Insufficient memory/cpu" → nodes are too small, scale up node count
```

### Pod stuck in `ImagePullBackOff`
```bash
kubectl describe pod <pod-name> -n perapulse
# Verify ACR attach:
az aks check-acr --name $AKS_CLUSTER --resource-group $RESOURCE_GROUP --acr $ACR_NAME
```

### Keycloak `JWT issuer mismatch` errors in service logs
The token's `iss` claim doesn't match `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI`.
1. Check what issuer Keycloak is embedding: decode any JWT at [jwt.io](https://jwt.io) and look at the `iss` field. It should be `http://api.perapulse.org/auth/realms/perapulse`.
2. Ensure `KC_HOSTNAME` in `keycloak.yaml` (`api.perapulse.org`) matches the `issuer-uri` in `app-config.yaml`.
3. After fixing, run:
   ```bash
   kubectl rollout restart deployment -n perapulse
   ```

### Keycloak fails to start / realm not imported
```bash
kubectl logs -n perapulse deployment/keycloak | grep -i "error\|import"
# Verify the realm ConfigMap exists:
kubectl get configmap keycloak-realm -n perapulse
```

---

## Teardown

```bash
# Delete just the K8s resources (keeps Azure resources)
kubectl delete namespace perapulse
kubectl delete namespace ingress-nginx

# Full teardown (deletes everything including the AKS cluster and ACR)
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

---

## File Reference

| File | Purpose |
|------|---------|
| `infra/k8s/namespace.yaml` | Creates the `perapulse` namespace |
| `infra/k8s/configmaps/app-config.yaml` | Shared env vars (service URLs, JWT URIs, Kafka) |
| `infra/k8s/configmaps/postgres-init.yaml` | PostgreSQL DB initialisation SQL |
| `infra/k8s/secrets/app-secrets.yaml` | DB password, Keycloak admin password |
| `infra/k8s/deployments/postgres.yaml` | PostgreSQL + PVC |
| `infra/k8s/deployments/redpanda.yaml` | Redpanda (Kafka) |
| `infra/k8s/deployments/keycloak.yaml` | Keycloak OIDC provider |
| `infra/k8s/deployments/api-gateway.yaml` | Spring Cloud Gateway |
| `infra/k8s/deployments/user-service.yaml` | User profiles & role management |
| `infra/k8s/deployments/feed-service.yaml` | Social feed |
| `infra/k8s/deployments/opportunities-service.yaml` | Jobs & internships |
| `infra/k8s/deployments/events-service.yaml` | Department events |
| `infra/k8s/deployments/notification-service.yaml` | Async notifications |
| `infra/k8s/deployments/analytics-service.yaml` | Admin analytics |
| `infra/k8s/ingress/ingress.yaml` | NGINX ingress (single public IP → gateway) |
