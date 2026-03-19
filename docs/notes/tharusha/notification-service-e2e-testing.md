# Notification Service — End-to-End Testing Walkthrough

> **Owner:** Tharusha  
> **Prerequisites:** Docker Desktop running, Java 21 available locally

---

## Overview

This walkthrough tests the complete flow:

```
Kafka event published → notification-service consumes it
  → saves to PostgreSQL → pushes to SSE stream → React client receives in real-time
```

Since the producer services (feed, events, opportunities, user) are not yet fully implemented, we simulate Kafka events manually using the Redpanda CLI.

---

## Step 1 — Start the Stack

Open a terminal in `PeraPulse/infra/`:

```powershell
docker compose up postgres keycloak redpanda redpanda-console notification-service
```

Wait until all four services are ready:

| Service | Ready when you see |
|---------|--------------------|
| `perapulse-postgres` | `database system is ready to accept connections` |
| `perapulse-keycloak` | `Started Keycloak` |
| `perapulse-redpanda` | `Successfully started Redpanda!` |
| `perapulse-notification-service` | `Started NotificationServiceApplication` |

---

## Step 2 — Create Kafka Topics (one-time)

Option A — via Redpanda Console UI at `http://localhost:8888` → Topics → Create Topic:

Create all 4:
- `perapulse.feed.events`
- `perapulse.opportunities.events`
- `perapulse.platform.events`
- `perapulse.user.events`

Option B — via Docker CLI:

```powershell
docker exec perapulse-redpanda rpk topic create `
  perapulse.feed.events `
  perapulse.opportunities.events `
  perapulse.platform.events `
  perapulse.user.events
```

---

## Step 3 — Check Health

```powershell
curl http://localhost:8085/actuator/health
# Expected: {"status":"UP"}
```

---

## Step 4 — Get a Keycloak Access Token

Open `http://localhost:8180/auth/admin` → log in with `admin / admin`.

Ensure a test user exists in the `perapulse` realm with role `STUDENT`.
Seed user (from Yohan's notes): `student1@eng.pdn.ac.lk` / `Student123!`

Get the token:

```powershell
$response = Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8080/auth/realms/perapulse/protocol/openid-connect/token" `
  -Body @{
    grant_type = "password"
    client_id  = "perapulse-web-test"
    username   = "student1@eng.pdn.ac.lk"
    password   = "Student123!"
  }

$TOKEN = $response.access_token
echo "Token obtained."
```

> **What is your `userSub`?** Because we used terminal/CLI login with a password grant, Keycloak omits the normal UUID `sub` claim from the access token. Our service smartly falls back to `preferred_username`. Therefore, **your `userSub` is exactly `student1@eng.pdn.ac.lk`**! You'll use this string in Step 6.

---

## Step 5 — Open the SSE Stream

In a new terminal window:

```powershell
curl.exe -i -N -H "Authorization: Bearer $TOKEN" `
     -H "Accept: text/event-stream" `
     http://localhost:8085/api/notifications/stream
```

You should immediately see:

```
event: connected
data: {"status":"connected","userSub":"<your-uuid-sub>"}
```

Then silence (keep-alive `:` comments appear every 25 seconds). **Keep this terminal open.**

> To test via the API Gateway instead: use port `8080`  — `http://localhost:8080/api/notifications/stream`

---

## Step 6 — Trigger Kafka Events and Watch the Stream

### Test A — `PostLiked` (personal notification)

Replace `<YOUR-USER-SUB>` with the `sub` from Step 4.

```powershell
$payload = '{"eventId":"aaaa-1111","eventType":"PostLiked","timestamp":"2026-03-13T12:00:00Z","producer":"feed-service","topic":"perapulse.feed.events","data":{"postId":"post-001","likerSub":"other-user-sub","authorSub":"<YOUR-USER-SUB>"}}'

echo $payload | docker exec -i perapulse-redpanda rpk topic produce perapulse.feed.events --brokers localhost:9092
```

**Expected SSE output:**
```
event: notification
data: {"id":"...","userSub":"<your-sub>","type":"POST_LIKED","title":"Someone liked your post","body":"A user liked your post.","read":false,"createdAt":"..."}
```

### Test B — `EventCreated` (broadcast to ALL_USERS)

```powershell
$payload = '{"eventId":"bbbb-2222","eventType":"EventCreated","timestamp":"2026-03-13T12:01:00Z","producer":"events-service","topic":"perapulse.platform.events","data":{"eventId":"event-001","title":"CS Department Tech Talk","startTime":"2026-03-20T10:00:00Z","createdBySub":"alumni-sub"}}'

echo $payload | docker exec -i perapulse-redpanda rpk topic produce perapulse.platform.events --brokers localhost:9092
```

**Expected SSE output:**
```
event: notification
data: {"userSub":"ALL_USERS","type":"EVENT_CREATED","title":"New event: CS Department Tech Talk","body":"A new department event has been posted. Check it out!","read":false}
```

### Test C — `OpportunityPosted` (broadcast to ALL_STUDENTS)

```powershell
$payload = '{"eventId":"cccc-3333","eventType":"OpportunityPosted","timestamp":"2026-03-13T12:02:00Z","producer":"opportunities-service","topic":"perapulse.opportunities.events","data":{"opportunityId":"opp-001","title":"Junior Software Engineer","company":"WSO2","type":"JOB","createdBySub":"alumni-sub"}}'

echo $payload | docker exec -i perapulse-redpanda rpk topic produce perapulse.opportunities.events --brokers localhost:9092
```

**Expected SSE output (only if logged-in user has STUDENT role):**
```
event: notification
data: {"userSub":"ALL_STUDENTS","type":"OPPORTUNITY_POSTED","title":"New opportunity: Junior Software Engineer at WSO2","body":"A new job/internship posting is available. Check it out!","read":false}
```

### Test D — `RoleRequestApproved` (personal)

```powershell
$payload = '{"eventId":"dddd-4444","eventType":"RoleRequestApproved","timestamp":"2026-03-13T12:03:00Z","producer":"user-service","topic":"perapulse.user.events","data":{"requestId":"req-001","userSub":"<YOUR-USER-SUB>","approvedBySub":"admin-sub"}}'

echo $payload | docker exec -i perapulse-redpanda rpk topic produce perapulse.user.events --brokers localhost:9092
```

**Expected SSE output:**
```
event: notification
data: {"userSub":"<your-sub>","type":"ROLE_REQUEST_APPROVED","title":"Alumni role request approved","body":"Your alumni role request has been approved! Please log out and log in again...","read":false}
```

### Self-action guard test

Set `likerSub` equal to `authorSub`:

```powershell
$payload = '{"eventId":"eeee-5555","eventType":"PostLiked","timestamp":"2026-03-13T12:04:00Z","producer":"feed-service","topic":"perapulse.feed.events","data":{"postId":"post-002","likerSub":"<YOUR-USER-SUB>","authorSub":"<YOUR-USER-SUB>"}}'

echo $payload | docker exec -i perapulse-redpanda rpk topic produce perapulse.feed.events --brokers localhost:9092
```

**Expected:** No SSE event (liking your own post is silently ignored).

---

## Step 7 — Verify REST Endpoints

After triggering events, the notifications should be persisted and retrievable via REST.

```powershell
# List notifications (paginated)
Invoke-RestMethod `
  -Uri "http://localhost:8085/api/notifications?page=0&size=20" `
  -Headers @{ Authorization = "Bearer $TOKEN" } | ConvertTo-Json -Depth 5

# Unread count
Invoke-RestMethod `
  -Uri "http://localhost:8085/api/notifications/unread-count" `
  -Headers @{ Authorization = "Bearer $TOKEN" }
# Expected: { "count": 3 } (or however many were created)

# Mark one as read (replace <id> with UUID from the list response)
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8085/api/notifications/<id>/read" `
  -Headers @{ Authorization = "Bearer $TOKEN" }
# Note: Do NOT add a trailing '.' after the command; it causes a positional parameter error.

# Mark all as read
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8085/api/notifications/read-all" `
  -Headers @{ Authorization = "Bearer $TOKEN" }

# Verify unread count is now 0
Invoke-RestMethod `
  -Uri "http://localhost:8085/api/notifications/unread-count" `
  -Headers @{ Authorization = "Bearer $TOKEN" }
```

---

## Step 8 — Check the Database Directly (optional)

```powershell
docker exec -it perapulse-postgres psql -U perapulse -d notification_db -c `
  "SELECT id, user_sub, type, title, read, created_at FROM notifications ORDER BY created_at DESC LIMIT 10;"
```

---

## Step 9 — Check Unauthenticated Rejection

```powershell
curl http://localhost:8085/api/notifications
# Expected: HTTP 401 Unauthorized
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `401 Unauthorized` on SSE or REST | Token expired | Re-fetch token from Keycloak (Step 4) |
| SSE connects but no events arrive | Wrong `authorSub` / `userSub` in event `data` | Check that the sub matches the logged-in user's JWT `sub` |
| No SSE connection confirmation event | Service not started | Check `docker logs perapulse-notification-service -f` |
| `Failed to publish message` in rpk | Topic doesn't exist | Run Step 2 to create topics |
| Database has no rows | JPA DDL not run | Look for `CREATE TABLE notifications` in service startup logs |
| Broadcast events not received | Role mismatch | STUDENT broadcasts only reach STUDENT-role users; check JWT |
| Service fails to start | Missing Kafka / Postgres | Check that `redpanda` and `postgres` are healthy first |

## Debugging Steps Performed Afterwards

- **Fixed Kafka Snappy decompression error**
  - Updated `services/notification-service/Dockerfile` to use Alpine base image and installed `libc6-compat`.
  - Rebuilt the `notification-service` container (`docker compose up --build notification-service`).
  - Verified logs show successful consumer group assignment and no `UnsatisfiedLinkError`.

- **Enabled Kafka listeners**
  - Added `@EnableKafka` to `NotificationServiceApplication`.
  - Created `KafkaConfig` with explicit `kafkaListenerContainerFactory` bean.

- **Adjusted SSE user identification**
  - Implemented fallback to `preferred_username` claim in `NotificationController` to obtain `userSub`.

- **Corrected PowerShell `Invoke‑RestMethod` syntax**
  - Removed stray trailing dot after the `-Headers` hashtable.
  - Added comment reminding not to include the dot.

- **Verified service health**
  - Ran `docker logs perapulse-notification-service -f` to confirm listeners start.
  - Checked Redpanda topics with `rpk topic consume` commands.

---

## Service Logs

```powershell
# Follow notification-service logs
docker logs perapulse-notification-service -f

# Check Redpanda topic contents
docker exec perapulse-redpanda rpk topic consume perapulse.feed.events --brokers localhost:9092 -n 5
```
