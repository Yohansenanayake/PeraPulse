const config = {
  authority: `${window.location.origin}/auth/realms/perapulse`,
  clientId: "perapulse-web-test",
  redirectUri: `${window.location.origin}/`,
  postLogoutRedirectUri: `${window.location.origin}/`,
  scopes: "openid profile email"
};

const storageKeys = {
  codeVerifier: "perapulse.pkce.verifier",
  state: "perapulse.pkce.state",
  tokenSet: "perapulse.auth.tokens"
};

const statusEl = document.getElementById("status");
const sessionOutputEl = document.getElementById("session-output");
const apiOutputEl = document.getElementById("api-output");

document.getElementById("login").addEventListener("click", startLogin);
document.getElementById("logout").addEventListener("click", logout);
document.getElementById("public-call").addEventListener("click", () => callApi("/api/users/public-info"));
document.getElementById("protected-call").addEventListener("click", () => callApi("/api/users/info", true));

initialize().catch(error => {
  apiOutputEl.textContent = `Initialization failed:\n${formatValue(error)}`;
});

async function initialize() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    apiOutputEl.textContent = `Keycloak returned an error:\n${error}`;
    clearAuthRequestState();
    cleanUrl();
    renderSession();
    return;
  }

  if (code) {
    await completeLogin(code, state);
    cleanUrl();
  }

  renderSession();
}

async function startLogin() {
  const verifier = randomString(64);
  const state = randomString(32);
  const challenge = await createCodeChallenge(verifier);

  sessionStorage.setItem(storageKeys.codeVerifier, verifier);
  sessionStorage.setItem(storageKeys.state, state);

  const authUrl = new URL(`${config.authority}/protocol/openid-connect/auth`);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scopes);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);

  window.location.assign(authUrl.toString());
}

async function completeLogin(code, returnedState) {
  const expectedState = sessionStorage.getItem(storageKeys.state);
  const verifier = sessionStorage.getItem(storageKeys.codeVerifier);

  if (!expectedState || !verifier || expectedState !== returnedState) {
    throw new Error("OIDC state validation failed.");
  }

  const tokenUrl = `${config.authority}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: verifier
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed with status ${response.status}`);
  }

  const tokenSet = await response.json();
  sessionStorage.setItem(storageKeys.tokenSet, JSON.stringify(tokenSet));
  clearAuthRequestState();
}

async function callApi(path, requiresAuth = false) {
  const tokenSet = getTokenSet();
  const headers = {};

  if (requiresAuth) {
    if (!tokenSet?.access_token) {
      apiOutputEl.textContent = "No access token is available. Log in first.";
      return;
    }

    headers.Authorization = `Bearer ${tokenSet.access_token}`;
  }

  const response = await fetch(path, { headers });
  const text = await response.text();
  let payload = text;

  try {
    payload = JSON.parse(text);
  } catch (error) {
    // Keep raw text if the response is not JSON.
  }

  apiOutputEl.textContent = `HTTP ${response.status}\n${formatValue(payload)}`;
}

function logout() {
  const tokenSet = getTokenSet();
  sessionStorage.removeItem(storageKeys.tokenSet);
  clearAuthRequestState();
  renderSession();

  if (!tokenSet?.id_token) {
    apiOutputEl.textContent = "Local session cleared.";
    return;
  }

  const logoutUrl = new URL(`${config.authority}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.set("id_token_hint", tokenSet.id_token);
  logoutUrl.searchParams.set("post_logout_redirect_uri", config.postLogoutRedirectUri);
  window.location.assign(logoutUrl.toString());
}

function renderSession() {
  const tokenSet = getTokenSet();

  if (!tokenSet?.access_token) {
    statusEl.textContent = "Not authenticated.";
    sessionOutputEl.textContent = "No token stored.";
    return;
  }

  const claims = parseJwt(tokenSet.access_token);
  statusEl.textContent = `Authenticated as ${claims.preferred_username || claims.email || claims.sub}`;
  sessionOutputEl.textContent = formatValue({
    access_token_claims: claims,
    expires_in: tokenSet.expires_in,
    refresh_expires_in: tokenSet.refresh_expires_in,
    token_type: tokenSet.token_type,
    scope: tokenSet.scope
  });
}

function getTokenSet() {
  const raw = sessionStorage.getItem(storageKeys.tokenSet);
  return raw ? JSON.parse(raw) : null;
}

function clearAuthRequestState() {
  sessionStorage.removeItem(storageKeys.codeVerifier);
  sessionStorage.removeItem(storageKeys.state);
}

function cleanUrl() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

function parseJwt(token) {
  const payload = token.split(".")[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(normalized));
}

function formatValue(value) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function randomString(length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, byte => charset[byte % charset.length]).join("");
}

async function createCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
