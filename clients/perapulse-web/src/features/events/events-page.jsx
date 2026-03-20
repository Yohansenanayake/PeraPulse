import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { eventsApi } from "@/api/events";
import { useAuthState } from "@/auth/use-auth-state";
import { useUiStore } from "@/store/ui-store";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export function EventsPage() {
  const { darkMode } = useUiStore();
  const { isAlumni, isAdmin } = useAuthState();
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["events", upcomingOnly],
    queryFn: () => eventsApi.getEvents(upcomingOnly),
  });

  const events = data?.content ?? data ?? [];

  const actions = (isAlumni || isAdmin) && (
    <Button asChild size="sm">
      <Link to="/events/create">+ Create Event</Link>
    </Button>
  );

  return (
    <div>
      <PageHeader title="Events" subtitle="Department events, workshops & seminars" actions={actions} />

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setUpcomingOnly(true)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${upcomingOnly ? darkMode ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-blue-100 text-slate-600 hover:bg-blue-200'}`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setUpcomingOnly(false)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!upcomingOnly ? darkMode ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-blue-100 text-slate-600 hover:bg-blue-200'}`}
        >
          All Events
        </button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && events.length === 0 && (
        <EmptyState icon={CalendarDays} title="No events" description="Check back later for upcoming events." />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((ev) => (
          <Link
            key={ev.id}
            to={`/events/${ev.id}`}
            className={`group flex flex-col overflow-hidden rounded-2xl border shadow-sm transition ${darkMode ? 'border-cyan-500/20 bg-gradient-to-br from-slate-900/50 to-blue-900/30 hover:border-cyan-400/50 hover:shadow-lg' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:border-blue-400 hover:shadow-lg'}`}
          >
            {ev.bannerUrl && (
              <img
                src={ev.bannerUrl}
                alt={ev.title}
                className="h-36 w-full object-cover"
                onError={(e) => e.target.classList.add("hidden")}
              />
            )}
            <div className="flex flex-1 flex-col p-4">
              <h3 className={`text-sm font-semibold line-clamp-2 transition-colors ${darkMode ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-blue-600'}`}>
                {ev.title}
              </h3>
              <div className={`mt-2 space-y-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {ev.startTime ? format(new Date(ev.startTime), "MMM d, yyyy · h:mm a") : "TBD"}
                </span>
                {ev.venue && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />{ev.venue}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
