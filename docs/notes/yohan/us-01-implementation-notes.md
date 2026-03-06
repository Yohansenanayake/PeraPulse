# US-01 Implementation Notes

## Goal

Implement the first end-to-end authentication slice for PeraPulse:

- Keycloak as Authorization Server / OpenID Provider
- `api-gateway` as primary entry point and resource server
- `user-service` as downstream resource server
- temporary browser page to test Authorization Code + PKCE
- one public and one protected user-service endpoint

## Final Decisions

- Keycloak-managed account creation is acceptable for MVP.
- Self-registration is enabled in Keycloak.
- Both `api-gateway` and `user-service` validate JWTs.
- The protected test endpoint requires authentication only.
- The browser sends the **access token** to the API gateway.
- The first endpoint returns both service info and principal info.
- The first UI is a temporary auth test page instead of the final React client.

## Local Flow

1. Browser opens `http://localhost:8080/`.
2. Temporary auth page redirects the user to Keycloak at `/auth`.
3. Keycloak authenticates the user and redirects back with an authorization code.
4. Browser exchanges the code for tokens using PKCE.
5. Browser calls `GET /api/users/info` through the gateway with `Authorization: Bearer <access_token>`.
6. Gateway validates the JWT and forwards the request to `user-service`.
7. `user-service` validates the same JWT again and returns protected data.

## Key Local URLs

- Gateway and temporary auth page: `http://localhost:8080/`
- Keycloak through gateway: `http://localhost:8080/auth`
- Direct Keycloak admin console: `http://localhost:8180/auth/admin`
- Public test endpoint through gateway: `http://localhost:8080/api/users/public-info`
- Protected test endpoint through gateway: `http://localhost:8080/api/users/info`

## Keycloak Setup Used

- Realm: `perapulse`
- Public client: `perapulse-web-test`
- Flow: Authorization Code with PKCE (`S256`)
- Self-registration: enabled
- Direct admin access from localhost is exposed on port `8180`
- Default student role: `STUDENT`
- Seed test user:
  - username: `student1@eng.pdn.ac.lk`
  - password: `Student123!`

## Important Implementation Detail

To avoid browser/container hostname mismatch during JWT validation:

- Browser-facing issuer is `http://localhost:8080/auth/realms/perapulse`
- Containers fetch JWKs internally from `http://keycloak:8080/auth/.../certs`

This keeps issuer validation aligned with the browser-visible URL while still allowing internal container networking.

## Local Admin Usage

- Use `http://localhost:8180/auth/admin` when you need to inspect realms, users, clients, roles, or tweak Keycloak settings directly.
- Use `http://localhost:8080/auth` as the browser-facing auth base for the application flow.
- Do not switch the SPA auth flow to `8180`, because the JWT issuer for the implemented slice is aligned to `http://localhost:8080/auth/realms/perapulse`.

## Remaining Follow-up Work

- Add role-based authorization once the basic flow is stable
- Replace the temporary auth page with the real web client
- Add user profile linkage and provisioning behavior after first login
- Add stronger tests around gateway and user-service security behavior
