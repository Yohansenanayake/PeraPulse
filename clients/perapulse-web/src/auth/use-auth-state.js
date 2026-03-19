import { useAuth } from "react-oidc-context";
import { useMemo } from "react";

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
    // Try realm_access first (Keycloak standard)
    const realmRoles = parsed?.realm_access?.roles ?? [];
    // Fallback: roles array directly on profile
    const directRoles = parsed?.roles ?? [];
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
