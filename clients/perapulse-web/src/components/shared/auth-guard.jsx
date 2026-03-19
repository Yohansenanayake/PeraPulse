import { Navigate } from "react-router-dom";
import { useAuthState } from "@/auth/use-auth-state";

/**
 * Redirects unauthenticated users to the landing page.
 * If `roles` is provided, also enforces role restriction.
 */
export function AuthGuard({ children, roles }) {
  const { auth, ready, hasRole } = useAuthState();

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.some((r) => hasRole(r))) {
    return <Navigate to="/feed" replace />;
  }

  return children;
}
