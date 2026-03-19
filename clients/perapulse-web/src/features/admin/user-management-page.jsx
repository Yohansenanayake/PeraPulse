import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { profilesApi } from "@/api/profiles";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Link } from "react-router-dom";

const ROLES = ["ALL", "STUDENT", "ALUMNI", "ADMIN"];

const ROLE_STYLES = {
  STUDENT: "bg-primary/15 text-primary",
  ALUMNI: "bg-amber-100 text-amber-700",
  ADMIN: "bg-red-100 text-red-700",
};

export function UserManagementPage() {
  const [roleFilter, setRoleFilter] = useState("ALL");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: () => profilesApi.getUsers(roleFilter === "ALL" ? null : roleFilter),
  });

  const users = data?.content ?? data ?? [];

  return (
    <div>
      <PageHeader title="User Management" subtitle="View and filter all registered users" />

      <div className="mb-6 flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${roleFilter === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {r === "ALL" ? "All Roles" : r.charAt(0) + r.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSkeleton count={5} />}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && users.length === 0 && (
        <EmptyState icon={Users} title="No users found" />
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>User</span>
          <span>Role</span>
          <span>Actions</span>
        </div>
        {users.map((user, idx) => (
          <div
            key={user.keycloakSub ?? user.id ?? idx}
            className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center border-t border-border px-5 py-3.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{user.displayName ?? "—"}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email ?? user.keycloakSub ?? ""}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${ROLE_STYLES[user.role] ?? "bg-muted text-muted-foreground"}`}>
              {user.role ?? "—"}
            </span>
            <Link
              to={`/profile/${user.keycloakSub ?? user.id}`}
              className="shrink-0 text-xs text-primary hover:underline"
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
