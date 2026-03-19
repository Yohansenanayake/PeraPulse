import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { eventsApi } from "@/api/events";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    venue: "",
    startTime: "",
    endTime: "",
    bannerUrl: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => eventsApi.createEvent(form),
    onSuccess: (created) => navigate(`/events/${created?.id ?? ""}`),
  });

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Back
      </button>
      <PageHeader title="Create Event" subtitle="Schedule a new department event or workshop" />

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
      >
        <Field label="Title *">
          <input required value={form.title} onChange={set("title")} placeholder="e.g. Annual Tech Talk 2026" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Time *">
            <input required type="datetime-local" value={form.startTime} onChange={set("startTime")} className={inputCls} />
          </Field>
          <Field label="End Time">
            <input type="datetime-local" value={form.endTime} onChange={set("endTime")} className={inputCls} />
          </Field>
        </div>
        <Field label="Venue">
          <input value={form.venue} onChange={set("venue")} placeholder="e.g. LT1, CE Dept" className={inputCls} />
        </Field>
        <Field label="Banner Image URL">
          <input value={form.bannerUrl} onChange={set("bannerUrl")} placeholder="https://…" className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={set("description")} rows={5} placeholder="Event details, agenda, speakers…" className={`${inputCls} resize-none`} />
        </Field>

        {mutation.isError && <p className="text-sm text-destructive">Failed to create event. Please try again.</p>}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create Event"}
        </Button>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
