import { useAuthState } from "@/auth/use-auth-state";

/**
 * Renders children only if user has at least one of the required roles.
 * `roles={["ADMIN", "ALUMNI"]}` — must have at least one.
 */
export function RoleGate({ children, roles, fallback = null }) {
  const { hasRole } = useAuthState();

  if (roles && !roles.some((r) => hasRole(r))) {
    return fallback;
  }
  return children;
}
