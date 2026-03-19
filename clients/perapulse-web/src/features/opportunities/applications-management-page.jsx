import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { opportunitiesApi } from "@/api/opportunities";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700",
  REVIEWED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

export function ApplicationsManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["applications", id],
    queryFn: () => opportunitiesApi.getApplications(id),
  });

  const apps = data?.content ?? data ?? [];

  const statusMutation = useMutation({
    mutationFn: ({ appId, status }) => opportunitiesApi.updateApplicationStatus(appId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications", id] }),
  });

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Back
      </button>
      <PageHeader title="Applications" subtitle={`Applications for opportunity ${id}`} />

      {isLoading && <LoadingSkeleton count={3} />}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && apps.length === 0 && <EmptyState title="No applications yet" />}

      <div className="space-y-4">
        {apps.map((app) => (
          <div key={app.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{app.applicantName ?? app.applicantSub}</p>
                <p className="text-xs text-muted-foreground">Applied {format(new Date(app.createdAt), "MMM d, yyyy")}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_COLORS[app.status] ?? "bg-muted text-muted-foreground"}`}>
                {app.status}
              </span>
            </div>
            {app.coverLetter && (
              <p className="mt-3 text-sm leading-6 text-foreground border-t border-border/60 pt-3">{app.coverLetter}</p>
            )}
            {app.resumeUrl && (
              <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                View Resume ↗
              </a>
            )}
            <div className="mt-4 flex gap-2">
              {["REVIEWED", "ACCEPTED", "REJECTED"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === "ACCEPTED" ? "default" : s === "REJECTED" ? "destructive" : "outline"}
                  disabled={app.status === s || statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ appId: app.id, status: s })}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
