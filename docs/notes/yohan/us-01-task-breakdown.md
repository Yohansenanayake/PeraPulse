# US-01 Task Breakdown

## User Story

**US-01**: As a student, I can register and log in using my university credentials so I can access the platform securely.

## Current Implementation Direction

- Authentication and OpenID Connect will be handled by **Keycloak** as the Authorization Server / Identity Provider.
- The **API Gateway** will be the primary **OAuth2 Resource Server** for incoming API traffic.
- The **Web UI** will use **Authorization Code Flow with PKCE**.
- For initial validation of the login flow, `user-service` will expose a simple protected test endpoint such as version info or contact info.
- The immediate goal is to prove the end-to-end flow:
  1. user logs in through Keycloak
  2. web client receives tokens
  3. web client calls API through gateway with bearer token
  4. gateway validates JWT
  5. request is forwarded to `user-service`
  6. protected endpoint is accessible only with a valid token

## Scope for US-01

### In Scope

- Keycloak realm/client setup for web login
- API Gateway JWT validation
- Token forwarding from gateway to downstream service
- One protected endpoint in `user-service`
- One public/unprotected endpoint in `user-service` for comparison if useful
- Basic role mapping for authenticated student access
- Local development configuration using Docker Compose
- Documentation for setup and test steps

### Out of Scope for This Slice

- Full user profile management
- Registration workflows beyond what Keycloak already provides
- Alumni/admin role upgrade flow
- Mobile login flow
- Fine-grained authorization across all services
- Production hardening beyond what is needed for local dev and architecture validation

## Proposed Task Breakdown

### 1. Define authentication architecture for the first vertical slice

- Confirm that Keycloak is the source of truth for identity.
- Confirm that the gateway is the first validation point for bearer tokens.
- Confirm whether downstream services will also validate JWTs or initially trust forwarded authenticated traffic from gateway.
- Define the minimal claims needed from the token for US-01:
  - `sub`
  - `preferred_username`
  - `email`
  - realm/client roles as needed

### 2. Configure Keycloak for local development

- Create or update the `perapulse` realm.
- Create a web client for the browser app using Authorization Code + PKCE.
- Define redirect URIs and post-logout redirect URIs for local web development.
- Decide whether self-registration is enabled in Keycloak for this project phase.
- Create at least one test student user if university SSO is not yet integrated.
- Define realm roles needed for initial authorization:
  - `STUDENT`
  - `ALUMNI`
  - `ADMIN`

### 3. Configure API Gateway as resource server

- Add Spring Security OAuth2 resource server support to `api-gateway`.
- Configure JWT issuer URI / JWK set resolution against Keycloak.
- Add route security rules:
  - allow auth-related browser redirects if needed
  - allow any explicitly public endpoints
  - require authentication for protected API routes
- Decide how user identity headers or token relay should be handled to downstream services.
- Add basic logging for auth failures for easier local debugging.

### 4. Define a minimal gateway route to `user-service`

- Create a route in the gateway for a test endpoint in `user-service`.
- Decide path shape, for example:
  - `GET /api/users/info`
  - `GET /api/users/version`
  - `GET /api/users/contact`
- Confirm whether the gateway rewrites the path before forwarding.

### 5. Implement a minimal protected endpoint in `user-service`

- Add one simple REST endpoint returning static or application-derived info.
- Protect the endpoint so only authenticated users can access it.
- Optionally add a public companion endpoint such as `/actuator/health` or `/api/users/public-info` for contrast.
- Return enough response detail to confirm principal propagation if needed:
  - application name
  - version
  - current authenticated subject or username

### 6. Decide downstream security model for this first increment

- Option A: gateway validates JWT, downstream service also validates JWT.
- Option B: gateway validates JWT, downstream service trusts internal traffic for now.
- For common Spring practice and better long-term consistency, Option A is usually cleaner, especially if services may be called directly later.
- Final decision should be documented before implementation starts.

### 7. Prepare local configuration and secrets

- Define local issuer URL, client IDs, and any client secrets required.
- Ensure Compose networking supports:
  - browser -> gateway
  - browser -> Keycloak
  - gateway -> user-service
  - gateway/user-service -> Keycloak JWKS endpoint
- Verify internal container URLs differ correctly from browser-facing URLs where necessary.

### 8. Web login integration for the initial test

- Choose the web client auth integration approach:
  - Keycloak JS adapter
  - generic OIDC library
- Implement login, logout, and token storage strategy appropriate for SPA use.
- Attach access token to API requests going through gateway.
- Handle unauthenticated and expired-token behavior cleanly.

### 9. Test the end-to-end auth flow

- Verify login redirect to Keycloak works.
- Verify successful callback returns authenticated SPA state.
- Verify calling protected endpoint without token returns `401`.
- Verify calling protected endpoint with valid student token returns `200`.
- Verify role-based constraints can be extended later without redesign.
- Capture curl/Postman/browser test evidence.

### 10. Documentation and handoff notes

- Record Keycloak realm/client configuration used for dev.
- Record all relevant local URLs and redirect URIs.
- Document the chosen security model for downstream services.
- Document how to reproduce the login flow locally.
- Document known limitations and next steps for US-08 / US-18 alignment.

## Suggested Deliverables

- Keycloak configuration notes or realm export update
- Gateway security configuration
- Gateway route to `user-service`
- Minimal protected endpoint in `user-service`
- Web login integration notes
- Local test procedure
- Evidence of successful authenticated request flow

## Acceptance Criteria for This Slice

- A user can authenticate through Keycloak from the web UI using Authorization Code + PKCE.
- The web app can call the gateway with a valid bearer token.
- The gateway validates the JWT using Keycloak metadata.
- A protected endpoint in `user-service` is accessible only with a valid token.
- Unauthenticated access is rejected.
- The local setup and test procedure are documented well enough for another team member to repeat.

## Dependencies

- Running Keycloak instance in local Compose
- Running API Gateway
- Running `user-service`
- Working browser-accessible web client or minimal login test client
- Network and URL configuration aligned between browser-facing and container-facing addresses

## Risks / Watch Items

- Confusion between browser-facing Keycloak URL and internal container Keycloak URL
- Incorrect redirect URI or CORS configuration
- Token audience / issuer mismatch between gateway and Keycloak
- Role mapping differences between realm roles and client roles
- Deciding too late whether downstream services also validate JWTs
- Using a login approach in the web client that is hard to extend for logout and token refresh

## Open Discussion Points

### 1. What exactly does "register using university credentials" mean for MVP?

- Does MVP require real university SSO integration?
- Or is Keycloak-managed account creation acceptable for the mini project?
- If university SSO is not available now, should we explicitly treat it as a future integration and use seeded student accounts in Keycloak for MVP?

### 2. Should `user-service` also be a resource server in the first increment?

- If yes, security is more realistic and reusable.
- If no, implementation is faster for the first demo but creates rework later.
- Recommendation: make both gateway and `user-service` validate JWTs, with gateway still being the primary entry point.

### 3. Which roles should be enforced for the first protected endpoint?

- Any authenticated user?
- Only `STUDENT`?
- Recommendation: for the first endpoint, require authentication only, then add role checks once the basic flow works.

### 4. Which token should the SPA send to the gateway?

- Access token should be used for API calls.
- ID token should not be used as API authorization.
- This should be stated explicitly in implementation notes.

### 5. What should the first test endpoint return?

- Static service metadata only
- Service metadata plus authenticated principal details
- Recommendation: include minimal principal info such as `sub` or username to prove identity propagation during testing.

### 6. Are we enabling self-registration in Keycloak?

- If enabled, it helps demonstrate "register".
- If disabled, user creation must be manual/admin-seeded for MVP.
- This affects how closely US-01 matches the wording in the proposal.

### 7. What web client will be used for the first validation?

- Existing React app if already scaffolded
- Minimal temporary auth test page
- Recommendation: use the real web client if available; otherwise implement the smallest possible auth test page and replace it later.

## Finalized Decisions

- Keycloak-managed account creation is acceptable for MVP.
- Both `api-gateway` and `user-service` will validate JWTs.
- The first protected endpoint will require authentication only, not a specific role.
- The SPA will use the **access token** for API calls.
- The first protected endpoint will return service metadata plus minimal principal details.
- Keycloak self-registration will be enabled.
- The first web client will be a minimal temporary auth test page.
- Direct Keycloak admin access will be exposed on localhost for manual configuration and inspection.

## Recommended First Implementation Order

1. Finalize open discussion decisions for token validation boundaries and MVP meaning of "register".
2. Configure Keycloak realm, roles, users, and web client.
3. Add gateway resource server security and routing.
4. Add a protected `user-service` endpoint.
5. Connect the web client login flow.
6. Run and document end-to-end tests.

## Notes for Future Stories

- This work should establish the security baseline for later user stories.
- US-08 depends on identity claims and profile linkage.
- US-18 will later depend on clear role modeling and likely Keycloak Admin API integration.
