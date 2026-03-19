import { useState } from "react";
import { format } from "date-fns";
import { ShieldCheck } from "lucide-react";

import { getErrorMessage } from "@/api/http-client";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  useAdminRoleRequests,
  useApproveRoleRequest,
  useRejectRoleRequest,
} from "@/features/user-service/use-user-service";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

function formatDate(value) {
  return value ? format(new Date(value), "MMM d, yyyy") : "-";
}

export function AdminRoleRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [feedback, setFeedback] = useState("");
  const {
    data: requests = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminRoleRequests(statusFilter === "ALL" ? null : statusFilter);

  const approve = useApproveRoleRequest();
  const reject = useRejectRoleRequest();

  const handleApprove = (id) => {
    setFeedback("");
    approve.mutate(id, {
      onError: (mutationError) => {
        setFeedback(getErrorMessage(mutationError, "Unable to approve this request."));
      },
    });
  };

  const handleReject = (id) => {
    setFeedback("");
    reject.mutate(id, {
      onError: (mutationError) => {
        setFeedback(getErrorMessage(mutationError, "Unable to reject this request."));
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Role Requests"
        subtitle="Review and act on alumni upgrade requests."
      />

      <div className="mb-6 flex gap-2">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {status === "ALL"
              ? "All"
              : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {feedback ? (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {feedback}
        </p>
      ) : null}

      {isLoading && <LoadingSkeleton count={3} />}
      {isError && (
        <ErrorState
          message={getErrorMessage(
            error,
            "Unable to load role requests right now."
          )}
          onRetry={refetch}
        />
      )}
      {!isLoading && !isError && requests.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title="No requests found"
          description="No alumni role requests match the current filter."
        />
      )}

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {request.userSub}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Requested role: {request.requestedRole ?? "ALUMNI"} - Graduation year:{" "}
                  {request.graduationYear ?? "-"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Submitted {formatDate(request.createdAt)}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                  STATUS_COLORS[request.status] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {request.status}
              </span>
            </div>

            {request.evidenceText ? (
              <p className="mt-3 border-t border-border/60 pt-3 text-sm text-muted-foreground">
                {request.evidenceText}
              </p>
            ) : null}

            {request.status === "PENDING" ? (
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove(request.id)}
                  disabled={approve.isPending || reject.isPending}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(request.id)}
                  disabled={approve.isPending || reject.isPending}
                >
                  Reject
                </Button>
              </div>
            ) : (
              <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                Reviewed by: {request.reviewedBySub ?? "Unknown reviewer"} -
                Updated {formatDate(request.updatedAt)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
