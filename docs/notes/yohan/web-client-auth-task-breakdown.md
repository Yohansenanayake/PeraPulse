# Web Client Auth Task Breakdown

## Objective

Replace the temporary static auth test page with the main **React + Vite** web client and integrate the existing Keycloak-based authentication flow into that frontend.

This work will reuse the current backend auth slice:

- Keycloak as Authorization Server / OIDC Provider
- `api-gateway` as the primary resource server and browser-facing auth path
- downstream services validating the forwarded access token
- browser using **Authorization Code Flow with PKCE**

## Current Starting Point

- `clients/web` is not scaffolded yet.
- Temporary auth flow is currently implemented in the gateway static page.
- The following backend flow is already working:
  - login through Keycloak
  - token exchange with PKCE
  - access token used for API calls
  - gateway validates JWT
  - `user-service` validates JWT
  - protected test endpoint returns authenticated principal info

## Scope

### In Scope

- Create a React app with Vite in `clients/web`
- Move the working browser auth flow into the React app
- Integrate Keycloak OIDC login/logout
- Store and manage tokens safely for the current project scope
- Call public and protected backend endpoints through `api-gateway`
- Add minimal authenticated and unauthenticated UI states
- Document setup and local testing steps

### Out of Scope

- Full product UI implementation
- Final design system and full routing architecture
- Mobile client auth integration
- Role-based feature gating across the full app
- Production deployment configuration for the web app

## Proposed Task Breakdown

### 1. Scaffold the React + Vite application

- Create the Vite React app under `clients/web`
- Set up a sensible project structure for growth, for example:
  - `src/app`
  - `src/auth`
  - `src/api`
  - `src/components`
  - `src/pages`
- Add basic scripts for dev, build, and preview
- Use plain JavaScript for this frontend

### 2. Decide the frontend auth integration approach

- Choose between:
  - implementing OIDC PKCE manually in React
  - using a dedicated OIDC client library
  - using the Keycloak JavaScript adapter
- Evaluate tradeoffs:
  - reliability
  - control
  - maintainability
  - alignment with the existing working flow
- Recommendation: use `react-oidc-context` on top of `oidc-client-ts` rather than re-implementing PKCE logic in app components

#### Comparison Summary

- `react-oidc-context` + `oidc-client-ts`
  - best fit for React state management and route-aware auth handling
  - standards-oriented rather than Keycloak-specific
  - easier to keep aligned with React app architecture as the frontend grows
- `keycloak-js`
  - valid option if the frontend stays tightly coupled to Keycloak
  - simpler for basic init/login/logout
  - less React-native, and usually ends up wrapped in app-specific state management anyway
- manual PKCE
  - not recommended now that the auth flow is already proven
  - adds avoidable maintenance and protocol-handling complexity

### 3. Define frontend auth architecture

- Define where auth state will live
- Define where token storage will live for MVP
- Decide how the app restores session state on page reload
- Define how login redirect, callback handling, and logout work
- Ensure the app uses only the **access token** for API calls
- Ensure the **ID token** is used only for logout/session identity hints

Current decision:

- Use session-based storage for the MVP frontend
- Preferred default: `sessionStorage`
- Keep the token lifetime bounded to the browser session during development

### 4. Configure Keycloak client settings for the React app

- Confirm the correct client to use:
  - reuse `perapulse-web-test`
  - or create a dedicated `web-client`
- Define redirect URIs for Vite local development
- Define post-logout redirect URIs
- Confirm allowed web origins
- Verify the browser-facing issuer remains `http://localhost:8080/auth/realms/perapulse`

Current decision:

- Create a dedicated Keycloak client for the React app
- Do not reuse the temporary `perapulse-web-test` client for the main frontend
- Configure the new client with the correct Vite development redirect URIs and web origins

### 5. Build the authentication module

- Create auth configuration for OIDC endpoints and client settings
- Add login action
- Add logout action
- Add callback handling logic
- Decode or inspect claims needed for UI state
- Handle unauthenticated, authenticating, authenticated, and error states
- Add token/session persistence behavior appropriate for the chosen library/approach

### 6. Build a minimal application shell

- Create a landing view
- Show whether the user is authenticated
- Display minimal identity info from claims, such as:
  - subject
  - username
  - email
  - roles if available
- Add buttons for:
  - login
  - logout
  - call public endpoint
  - call protected endpoint

### 7. Build API integration for gateway calls

- Centralize API base URL configuration
- Add a small API client wrapper
- Automatically attach the **access token** for protected calls
- Handle `401` and `403` cleanly
- Add calls for:
  - `GET /api/users/public-info`
  - `GET /api/users/info`

### 8. Handle development-time local networking

- Decide whether the React app will:
  - run on its own Vite dev server
  - or be served through gateway later
- If using Vite dev server, configure:
  - frontend URL, likely `http://localhost:5173`
  - correct Keycloak redirect URIs
  - API base URL pointing to `http://localhost:8080`
- Decide whether to use Vite proxy or direct browser calls to gateway

Current decision:

- Use the Vite dev server for frontend development
- Frontend local URL will be `http://localhost:5173`
- Backend/API gateway remains on `http://localhost:8080`

### 9. Replace the temporary static page progressively

- Keep the current static test page until React auth is stable
- Once React flow works, decide whether to:
  - remove the temporary page
  - keep it as a low-level troubleshooting tool
- Recommendation: keep it briefly as a fallback until the React flow is fully verified

Current decision:

- Keep the temporary static auth page until the React client flow is verified and stable

### 10. Test the full browser flow in the React app

- Verify login redirect works
- Verify callback processing works
- Verify session survives refresh if expected
- Verify logout clears local state and ends the Keycloak session
- Verify public endpoint works without login
- Verify protected endpoint works after login
- Verify protected endpoint fails gracefully without login

### 11. Implement refresh token support after primary auth flow is stable

- Confirm the new React Keycloak client is allowed to issue refresh tokens for the SPA flow
- Decide how the chosen OIDC library will renew access tokens
- Implement token renewal after the primary login/callback/API flow is working
- Update auth state cleanly when refreshed tokens are received
- Handle refresh failure by forcing logout or reauthentication
- Verify the app can continue making protected API calls after access token expiry

### 12. Document implementation and usage

- Record frontend auth library/approach decision
- Record local URLs and environment variables
- Record Keycloak client configuration needed for React dev
- Record refresh token behavior and any related client settings
- Record known limitations and next steps

## Suggested Deliverables

- Vite React app scaffold in `clients/web`
- Auth integration module
- Minimal authenticated app shell
- API client for gateway requests
- Updated Keycloak client configuration notes
- Refresh token handling after the primary auth flow is stable
- Local run/test instructions

## Acceptance Criteria

- A React + Vite app exists in `clients/web`
- The app can log in through Keycloak using Authorization Code + PKCE
- The app uses the access token to call backend APIs through the gateway
- The app can successfully call:
  - public endpoint without login
  - protected endpoint after login
- Logout ends both local session state and the Keycloak browser session
- After primary setup is complete, the app can refresh tokens and continue authenticated API access without forcing immediate re-login
- The setup is documented well enough for another team member to run it

## Open Discussion Points

### 1. React with TypeScript or JavaScript?

- TypeScript gives better long-term maintainability
- JavaScript is faster for immediate implementation
- Final decision: use JavaScript

### 2. Which auth integration approach should be used?

- Keycloak JS adapter
- `oidc-client-ts` or similar OIDC library
- manual PKCE implementation ported from the temporary page
- Final decision: use `react-oidc-context` with `oidc-client-ts`

### 3. What should be used for local token storage?

- in-memory only
- sessionStorage
- localStorage
- Final decision: prefer `sessionStorage`

### 4. Will refresh token support be implemented?

- Final decision: yes
- implement it after the primary login/callback/protected API flow is stable

### 5. What should the local frontend URL be?

- `http://localhost:5173` using Vite dev server
- `http://localhost:8080` when later served behind gateway
- Final decision: start with Vite dev server on `http://localhost:5173`

### 6. Should the temporary static auth page be removed immediately?

- Final decision: no
- keep it until the React client proves the same flow reliably

## Finalized Decisions

- Use React with Vite and plain JavaScript
- Use `react-oidc-context` with `oidc-client-ts` for OIDC integration
- Use `sessionStorage` for MVP session/token persistence
- Use the Vite dev server at `http://localhost:5173`
- Create a dedicated Keycloak client for the React app with correct redirect URIs
- Implement refresh token support after the primary auth flow is stable
- Keep the temporary static auth page until the React implementation is stable

## Recommended Implementation Order

1. Finalize React stack decisions: TypeScript vs JavaScript, auth library, token storage, dev URL.
2. Scaffold the Vite app in `clients/web`.
3. Configure Keycloak redirect URIs for the chosen frontend URL.
4. Implement login, callback, session restore, and logout.
5. Add API calls to the public and protected test endpoints.
6. Verify the React flow end to end.
7. Document the final setup and decide whether to retire the temporary auth page.

## Dependencies

- Working Keycloak realm and client configuration
- Working gateway route for `/auth/**`
- Working gateway route for `/api/users/**`
- Working protected endpoint in `user-service`
- Docker Compose auth slice running locally

## Risks / Watch Items

- Redirect URI mismatch when moving from `localhost:8080` to Vite dev port
- CORS or web origin issues in Keycloak
- Accidentally using the ID token for API authorization
- Token persistence decisions becoming hard to unwind later
- Replacing the static page too early and losing a useful debugging baseline
