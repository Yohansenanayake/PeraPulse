## User Service MVP Plan (Profiles + Alumni Role Requests)

### Summary
Implement `user-service` as the first production-style domain service with persistent profile management and admin-reviewed alumni role requests. Keep existing `/api/users/*` auth smoke-test endpoints for now, and add proposal-aligned `/api/profiles/*` and `/api/admin/*` APIs. Use Flyway for schema evolution and Phase-1 DB-only approval flow (no Keycloak Admin API call yet).

### Implementation Changes
1. **Domain + persistence**
- Add Flyway to `user-service` and create initial migration for `user_profile` and `role_request`.
- `user_profile` fields: `id`, `keycloak_sub` (unique), `role`, `display_name`, `email`, `department`, `grad_year`, `bio`, `linkedin_url`, `avatar_url`, timestamps.
- `role_request` fields: `id`, `user_sub`, `requested_role` (default `ALUMNI`), `graduation_year`, `evidence_text`, `status` (`PENDING|APPROVED|REJECTED`), `reviewed_by_sub`, timestamps.
- Add JPA entities, repositories, and indexes for `keycloak_sub`, `status`, and `(user_sub, status)` query paths.

2. **Application/API layer**
- Add profile APIs:
  - `GET /api/profiles/me` (auto-create profile from JWT claims if missing)
  - `PUT /api/profiles/me`
  - `GET /api/profiles/{sub}` (public-safe subset)
- Add admin APIs:
  - `GET /api/admin/users?role=...`
  - `GET /api/admin/users/{sub}`
  - `GET /api/admin/role-requests?status=...`
  - `PUT /api/admin/role-requests/{id}/approve`
  - `PUT /api/admin/role-requests/{id}/reject`
- Add student API:
  - `POST /api/profiles/role-requests`
- Keep existing `GET /api/users/public-info` and `GET /api/users/info` unchanged for compatibility/smoke testing.

3. **Security + auth mapping**
- Update method/route authorization:
  - authenticated: `/api/profiles/**`
  - student-only: role-request submit
  - admin-only: `/api/admin/**`
  - public: `/api/users/public-info` (existing), and `/api/profiles/{sub}` with sanitized response
- Standardize role extraction from Keycloak JWT (`realm_access.roles`) and map to Spring authorities (`ROLE_STUDENT`, `ROLE_ALUMNI`, `ROLE_ADMIN`).
- Preserve resource-server JWT validation settings in `application.yaml`.

4. **Gateway and integration alignment**
- Update gateway route matching to forward new user-service paths (`/api/profiles/**`, `/api/admin/**`) in addition to existing `/api/users/**`.
- Keep response/error shape consistent with project proposal error contract.
- Defer Keycloak role assignment automation to Phase 2; approval endpoint updates only internal request status and reviewer metadata.

5. **Code structure and quality**
- Introduce DTOs + validation annotations for request payloads.
- Add global exception handler for not-found, validation, forbidden, and conflict cases.
- Add auditing support for `created_at/updated_at` consistency (entity listeners or service-level timestamp updates).

### Public Interfaces / Contract Additions
- **New endpoints:** `/api/profiles/*`, `/api/admin/*` (listed above).
- **Request/response types:**
  - `UpdateMyProfileRequest`
  - `SubmitRoleRequestRequest`
  - `RoleRequestDecisionResponse`
  - `UserProfileResponse` (full for self/admin, limited for public)
- **Behavioral contract:** first `GET /api/profiles/me` creates a profile using JWT subject/claims if absent.

### Test Plan
- **Repository tests:** uniqueness, filter queries, status transitions.
- **Service tests:** first-login auto-create, role-request submit constraints, approve/reject state machine.
- **Controller/security tests (MockMvc + JWT):**
  - student can submit role request, cannot access admin endpoints
  - admin can list/approve/reject requests
  - authenticated user can read/update own profile only
  - public profile returns sanitized fields
- **Integration tests (Postgres/Testcontainers preferred):**
  - Flyway migration applies cleanly
  - end-to-end `GET /api/profiles/me` auto-creation path
- **Gateway smoke tests:** `/api/profiles/me` and `/api/admin/users` route correctly through API gateway with JWT.

### Assumptions and Defaults
- Scope fixed to **Profiles + Role Requests** only for this phase.
- Role approval is **DB-only Phase 1**; Keycloak role change is manual outside service.
- Migration strategy is **Flyway** (not `ddl-auto`).
- Existing `/api/users/*` test endpoints remain temporarily for auth diagnostics.
- No Kafka `perapulse.user.events` publishing in this phase unless explicitly added later.
