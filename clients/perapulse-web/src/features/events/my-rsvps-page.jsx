import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { eventsApi } from "@/api/events";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

const RSVP_COLORS = {
  GOING: "bg-emerald-100 text-emerald-700",
  MAYBE: "bg-amber-100 text-amber-700",
  NOT_GOING: "bg-red-100 text-red-600",
};

export function MyRsvpsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-rsvps"],
    queryFn: () => eventsApi.getMyRsvps(),
  });

  const rsvps = data?.content ?? data ?? [];

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="My RSVPs" subtitle="Events you have responded to" />

      {isLoading && <LoadingSkeleton count={3} />}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && rsvps.length === 0 && (
        <EmptyState icon={CalendarDays} title="No RSVPs yet" description="Browse events and RSVP!" />
      )}

      <div className="space-y-3">
        {rsvps.map((r) => (
          <Link
            key={r.eventId}
            to={`/events/${r.eventId}`}
            className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 shadow-sm hover:border-primary/40 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{r.eventTitle ?? `Event ${r.eventId}`}</p>
              <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {r.startTime ? format(new Date(r.startTime), "MMM d, yyyy") : ""}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${RSVP_COLORS[r.status] ?? "bg-muted text-muted-foreground"}`}>
              {r.status?.replace("_", " ")}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
