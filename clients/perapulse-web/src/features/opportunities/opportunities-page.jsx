import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Briefcase, MapPin, Clock, Filter } from "lucide-react";
import { opportunitiesApi } from "@/api/opportunities";
import { useAuthState } from "@/auth/use-auth-state";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

const TYPE_OPTIONS = ["ALL", "JOB", "INTERNSHIP"];
const STATUS_OPTIONS = ["OPEN", "CLOSED"];

export function OpportunitiesPage() {
  const { isAlumni, isAdmin } = useAuthState();
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("OPEN");

  const params = {};
  if (typeFilter !== "ALL") params.type = typeFilter;
  params.status = statusFilter;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["opportunities", typeFilter, statusFilter],
    queryFn: () => opportunitiesApi.getOpportunities(params),
  });

  const items = data?.content ?? data ?? [];

  const actions = (isAlumni || isAdmin) && (
    <Button asChild size="sm">
      <Link to="/opportunities/create">+ Post Opportunity</Link>
    </Button>
  );

  return (
    <div>
      <PageHeader
        title="Jobs & Internships"
        subtitle="Opportunities posted by alumni and partners"
        actions={actions}
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <div className="flex gap-1">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {t === "ALL" ? "All Types" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState icon={Briefcase} title="No opportunities found" description="Try adjusting your filters." />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((opp) => (
          <Link
            key={opp.id}
            to={`/opportunities/${opp.id}`}
            className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${opp.type === "JOB" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}>
                  {opp.type}
                </span>
                <h3 className="mt-1.5 text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {opp.title}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">{opp.company}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${opp.status === "OPEN" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                {opp.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {opp.location && (
                <span className="flex items-center gap-1"><MapPin className="size-3" />{opp.location}</span>
              )}
              {opp.deadline && (
                <span className="flex items-center gap-1"><Clock className="size-3" />Deadline: {format(new Date(opp.deadline), "MMM d, yyyy")}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
