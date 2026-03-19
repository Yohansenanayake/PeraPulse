import { useAuth } from "react-oidc-context";
import { useMemo } from "react";

function decodeJwtPayload(token) {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/**
 * Returns user info and role helpers from the OIDC context.
 */
export function useAuthState() {
  const auth = useAuth();

  const userLabel = useMemo(() => {
    const profile = auth.user?.profile;
    return (
      profile?.preferred_username ||
      profile?.email ||
      profile?.sub ||
      "unknown user"
    );
  }, [auth.user]);

  // Keycloak puts realm_access.roles in the JWT
  const roles = useMemo(() => {
    const parsed = auth.user?.profile;
    const accessTokenClaims = decodeJwtPayload(auth.user?.access_token);

    // Try realm_access first (Keycloak standard)
    const realmRoles =
      parsed?.realm_access?.roles ??
      accessTokenClaims?.realm_access?.roles ??
      [];

    // Fallback: roles array directly on profile
    const directRoles =
      parsed?.roles ??
      accessTokenClaims?.roles ??
      [];

    return new Set([...realmRoles, ...directRoles].map((r) => r.toUpperCase()));
  }, [auth.user]);

  const hasRole = (role) => roles.has(role?.toUpperCase());
  const isAdmin = roles.has("ADMIN");
  const isAlumni = roles.has("ALUMNI");
  const isStudent = roles.has("STUDENT");

  return {
    auth,
    ready: !auth.isLoading,
    userLabel,
    roles,
    hasRole,
    isAdmin,
    isAlumni,
    isStudent,
    login: () => {
      sessionStorage.setItem(
        "perapulse.post_login_path",
        window.location.pathname + window.location.search
      );
      auth.signinRedirect();
    },
    logout: () => auth.signoutRedirect(),
    accessToken: auth.user?.access_token ?? null,
  };
}
