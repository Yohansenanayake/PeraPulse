import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { opportunitiesApi } from "@/api/opportunities";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700",
  REVIEWED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

export function MyApplicationsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => opportunitiesApi.getMyApplications(),
  });

  const apps = data?.content ?? data ?? [];

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="My Applications" subtitle="Track the status of your job and internship applications" />

      {isLoading && <LoadingSkeleton count={4} />}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && apps.length === 0 && (
        <EmptyState title="No applications yet" description="Browse opportunities and apply!" />
      )}

      <div className="space-y-4">
        {apps.map((app) => (
          <div key={app.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  to={`/opportunities/${app.opportunityId}`}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {app.opportunityTitle ?? `Opportunity ${app.opportunityId}`}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {app.company ?? ""} · Applied {format(new Date(app.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_COLORS[app.status] ?? "bg-muted text-muted-foreground"}`}>
                {app.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
