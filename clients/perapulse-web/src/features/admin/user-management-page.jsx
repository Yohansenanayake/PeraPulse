import { useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";

import { getErrorMessage } from "@/api/http-client";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { useAdminUsers } from "@/features/user-service/use-user-service";

const ROLES = ["ALL", "STUDENT", "ALUMNI", "ADMIN"];

const ROLE_STYLES = {
  STUDENT: "bg-primary/15 text-primary",
  ALUMNI: "bg-amber-100 text-amber-700",
  ADMIN: "bg-red-100 text-red-700",
};

export function UserManagementPage() {
  const [roleFilter, setRoleFilter] = useState("ALL");
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminUsers(roleFilter === "ALL" ? null : roleFilter);

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="View and filter all registered users."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              roleFilter === role
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {role === "ALL"
              ? "All Roles"
              : role.charAt(0) + role.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSkeleton count={5} />}
      {isError && (
        <ErrorState
          message={getErrorMessage(error, "Unable to load users right now.")}
          onRetry={refetch}
        />
      )}
      {!isLoading && !isError && users.length === 0 && (
        <EmptyState icon={Users} title="No users found" />
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>User</span>
          <span>Role</span>
          <span>Actions</span>
        </div>

        {users.map((user, index) => (
          <div
            key={user.keycloakSub ?? index}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-t border-border px-5 py-3.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.displayName ?? "-"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email ?? user.keycloakSub ?? ""}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                ROLE_STYLES[user.role] ?? "bg-muted text-muted-foreground"
              }`}
            >
              {user.role ?? "-"}
            </span>

            <Link
              to={`/admin/users/${user.keycloakSub}`}
              className="shrink-0 text-xs text-primary hover:underline"
            >
              Manage
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
