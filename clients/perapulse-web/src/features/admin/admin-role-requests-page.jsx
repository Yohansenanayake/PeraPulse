import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { profilesApi } from "@/api/profiles";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

export function AdminRoleRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-role-requests", statusFilter],
    queryFn: () => profilesApi.getRoleRequests(statusFilter === "ALL" ? null : statusFilter),
  });

  const requests = data?.content ?? data ?? [];

  const approve = useMutation({
    mutationFn: (id) => profilesApi.approveRoleRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-role-requests"] }),
  });

  const reject = useMutation({
    mutationFn: (id) => profilesApi.rejectRoleRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-role-requests"] }),
  });

  return (
    <div>
      <PageHeader title="Role Requests" subtitle="Review and act on alumni upgrade requests" />

      <div className="mb-6 flex gap-2">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSkeleton count={3} />}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && requests.length === 0 && (
        <EmptyState icon={ShieldCheck} title="No requests found" description="No role requests matching this filter." />
      )}

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{req.displayName ?? req.userSub}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Graduation Year: {req.graduationYear ?? "—"} ·{" "}
                  Submitted {req.createdAt ? format(new Date(req.createdAt), "MMM d, yyyy") : ""}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_COLORS[req.status] ?? "bg-muted text-muted-foreground"}`}>
                {req.status}
              </span>
            </div>

            {req.evidenceText && (
              <p className="mt-3 text-sm text-muted-foreground border-t border-border/60 pt-3">{req.evidenceText}</p>
            )}

            {req.status === "PENDING" && (
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => approve.mutate(req.id)}
                  disabled={approve.isPending}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => reject.mutate(req.id)}
                  disabled={reject.isPending}
                >
                  Reject
                </Button>
              </div>
            )}

            {req.status !== "PENDING" && (
              <p className="mt-3 text-xs text-muted-foreground border-t border-border/60 pt-3">
                Reviewed by: {req.reviewedBySub ?? "admin"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
