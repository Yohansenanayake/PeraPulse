# Web Client Auth Implementation Notes

## Goal

Implement the main React + Vite web client for the existing Keycloak-based authentication flow, replacing the temporary static browser page as the primary frontend auth surface.

This implementation keeps the current backend security model intact:

- Keycloak is the Authorization Server / OpenID Provider
- `api-gateway` is the primary browser-facing resource server
- downstream services validate the forwarded access token
- the browser uses Authorization Code Flow with PKCE

## What Was Implemented

### Frontend stack

- React + Vite application created in `clients/perapulse-web`
- JavaScript used instead of TypeScript
- Tailwind CSS integrated
- `shadcn/ui` installed using the Radix-based preset
- `axios` added for API access
- `react-oidc-context` and `oidc-client-ts` added for OIDC integration

### Frontend structure

Current structure:

- `src/app`
  - top-level app shell and providers
- `src/auth`
  - OIDC configuration and auth state helpers
- `src/api`
  - axios client and request handling
- `src/features/home`
  - initial landing page for auth/API verification
- `src/components/ui`
  - shared UI primitives from `shadcn/ui`
- `src/lib`
  - utility helpers

### Keycloak integration

- A dedicated React client was defined for Keycloak:
  - `perapulse-react-web`
- Redirect URI:
  - `http://localhost:5173/*`
- Post-logout redirect URI:
  - `http://localhost:5173/*`
- Web origin:
  - `http://localhost:5173`

### OIDC behavior in the React app

- Browser authority:
  - `http://localhost:8080/auth/realms/perapulse`
- Client:
  - `perapulse-react-web`
- Redirect URI:
  - `http://localhost:5173/`
- Post-logout redirect URI:
  - `http://localhost:5173/`
- Session persistence:
  - `sessionStorage`
- `loadUserInfo` disabled to avoid unnecessary browser-side `userinfo` fetches

## Important Runtime Decisions

### Access token vs ID token

- The React app uses the **access token** for API calls.
- The **ID token** is not used for backend authorization.
- The decoded `profile` visible in the React auth diagnostics comes from token claims, primarily from the ID token managed by the OIDC client library.
- The ID token remains relevant for identity/session concerns such as logout hints.

### API communication model

- The frontend uses `axios` with a direct gateway base URL:
  - `http://localhost:8080`
- No Vite dev proxy is used.
- This keeps local development closer to the intended production shape.

### Token attachment

- `axios` request interception is used to attach the current access token automatically.
- The access token provider is wired from the OIDC auth provider layer into the shared axios client.
- Components no longer need to manually set the `Authorization` header for protected endpoint calls.

## CORS Outcome

Because the frontend now calls the gateway directly from `http://localhost:5173`:

- CORS must be configured at `api-gateway`
- CORS does not need to be configured at `user-service` for requests routed through the gateway

Current gateway rule:

- allow `http://localhost:5173` for `/api/**`
- do not force gateway CORS handling on `/auth/**`

This was important because:

- Keycloak already handles `/auth/**`
- adding gateway CORS to `/auth/**` caused duplicate `Access-Control-Allow-Origin` headers
- that broke OIDC discovery in the browser

## Issues Encountered and Fixes

### 1. Gateway route issues

- Initial gateway route config did not reliably proxy `/auth/**` and `/api/users/**`
- Route definitions were moved into explicit Java configuration for clarity and control

### 2. Public endpoint 404 through gateway

- Root cause was gateway routing, not the user-service endpoint itself
- Direct user-service and container-to-container checks confirmed the service was fine

### 3. Protected endpoint failure after login

- Root cause was a `NullPointerException` in `user-service`
- `Map.of(...)` was used with nullable token claims
- Replaced with a mutable map that tolerates missing claims

### 4. React login not redirecting

- Root cause was duplicate CORS headers on `/auth/**`
- Gateway CORS was restricted to `/api/**`

### 5. React callback returned but user stayed unauthenticated

- Root cause was browser-side `userinfo` fetch after callback
- `react-oidc-context` was configured with:
  - `loadUserInfo: false`

After that:

- redirect to Keycloak worked
- redirect back to React worked
- auth state propagated correctly
- public and protected endpoint calls worked from React

## Current Working Behavior

From the React app:

- public endpoint works without login
- login redirects to Keycloak
- successful login returns to the React app
- authenticated state is visible in the app
- protected endpoint works after login
- access token is attached through axios interceptors
- logout flow is wired through the OIDC client

## Current Environment Values

Frontend:

- `VITE_API_BASE_URL=http://localhost:8080`
- `VITE_OIDC_AUTHORITY=http://localhost:8080/auth/realms/perapulse`
- `VITE_OIDC_CLIENT_ID=perapulse-react-web`
- `VITE_OIDC_REDIRECT_URI=http://localhost:5173/`
- `VITE_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:5173/`

## Key Files

Frontend:

- `clients/perapulse-web/src/app/providers.jsx`
- `clients/perapulse-web/src/auth/oidc-config.js`
- `clients/perapulse-web/src/auth/use-auth-state.js`
- `clients/perapulse-web/src/api/http-client.js`
- `clients/perapulse-web/src/app/app-shell.jsx`
- `clients/perapulse-web/src/features/home/landing-page.jsx`

Backend support:

- `services/api-gateway/src/main/java/com/perapulse/api_gateway/config/SecurityConfig.java`
- `services/api-gateway/src/main/java/com/perapulse/api_gateway/config/GatewayRoutesConfig.java`
- `infra/keycloak/perapulse-realm.json`

## Remaining Work

- implement refresh token handling after the primary auth flow
- add centralized axios response handling for `401` / expired sessions
- reduce or refine the current diagnostics-heavy landing page
- replace the temporary static page only after the React flow proves stable over time
- move from auth test surface toward actual app routes and feature pages
