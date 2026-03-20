import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { getMockEventById } from "@/features/events/mock-events";

const RSVP_OPTIONS = [
  { value: "GOING", label: "Going", color: "bg-emerald-500" },
  { value: "MAYBE", label: "Maybe", color: "bg-amber-500" },
  { value: "NOT_GOING", label: "Not Going", color: "bg-red-500" },
];

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ev = getMockEventById(id);
  const [selectedRsvp, setSelectedRsvp] = useState(ev?.myRsvp ?? null);

  if (!ev) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Back
      </button>

      {ev.bannerUrl && (
        <img
          src={ev.bannerUrl}
          alt={ev.title}
          className="mb-5 w-full rounded-2xl object-cover max-h-56"
          onError={(e) => e.target.classList.add("hidden")}
        />
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{ev.title}</h1>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {ev.startTime ? format(new Date(ev.startTime), "MMMM d, yyyy · h:mm a") : "TBD"}
            {ev.endTime && ` – ${format(new Date(ev.endTime), "h:mm a")}`}
          </span>
          {ev.venue && <span className="flex items-center gap-1.5"><MapPin className="size-4" />{ev.venue}</span>}
        </div>

        {ev.description && (
          <p className="mt-5 text-sm leading-7 text-foreground border-t border-border pt-5 whitespace-pre-wrap">
            {ev.description}
          </p>
        )}

        {/* RSVP */}
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-sm font-semibold mb-3">RSVP</p>
          <div className="flex flex-wrap gap-2">
            {RSVP_OPTIONS.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => setSelectedRsvp(value)}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${selectedRsvp === value ? `${color} text-white border-transparent` : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground bg-background"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {selectedRsvp && (
            <p className="mt-2 text-xs text-muted-foreground">Your current RSVP: <span className="font-semibold">{selectedRsvp}</span></p>
          )}
        </div>
      </div>
    </div>
  );
}
