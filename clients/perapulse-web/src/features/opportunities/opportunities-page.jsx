import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Briefcase, MapPin, Clock, Filter } from "lucide-react";
import { opportunitiesApi } from "@/api/opportunities";
import { useAuthState } from "@/auth/use-auth-state";
import { useUiStore } from "@/store/ui-store";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

const TYPE_OPTIONS = ["ALL", "JOB", "INTERNSHIP"];
const STATUS_OPTIONS = ["OPEN", "CLOSED"];

export function OpportunitiesPage() {
  const { isAlumni, isAdmin } = useAuthState();
  const { darkMode } = useUiStore();
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
    <Button asChild size="sm" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg">
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
        <Filter className={`size-4 ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
        <div className="flex gap-1">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${typeFilter === t ? (darkMode ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md" : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md") : (darkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700" : "bg-white text-slate-600 hover:bg-blue-50 border border-blue-200")}`}
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
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${statusFilter === s ? (darkMode ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md" : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md") : (darkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700" : "bg-white text-slate-600 hover:bg-blue-50 border border-blue-200")}`}
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
            className={`group rounded-2xl border p-5 shadow-lg transition-all duration-300 ${darkMode ? 'border-cyan-500/20 bg-gradient-to-br from-slate-900/50 to-blue-900/30 hover:border-cyan-400/60 hover:shadow-xl hover:scale-105' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:border-blue-400 hover:shadow-xl hover:scale-105'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${opp.type === "JOB" ? (darkMode ? "bg-indigo-500/30 text-indigo-200" : "bg-indigo-100 text-indigo-700") : (darkMode ? "bg-amber-500/30 text-amber-200" : "bg-amber-100 text-amber-700")}`}>
                  {opp.type}
                </span>
                <h3 className={`mt-1.5 text-sm font-semibold line-clamp-2 ${darkMode ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-blue-600'} transition-colors`}>
                  {opp.title}
                </h3>
                <p className={`mt-0.5 text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{opp.company}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${opp.status === "OPEN" ? (darkMode ? "bg-emerald-500/30 text-emerald-200" : "bg-emerald-100 text-emerald-700") : (darkMode ? "bg-red-500/30 text-red-200" : "bg-red-100 text-red-700")}`}>
                {opp.status}
              </span>
            </div>
            <div className={`mt-3 flex flex-wrap gap-3 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
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
