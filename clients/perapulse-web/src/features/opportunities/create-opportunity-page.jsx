import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { opportunitiesApi } from "@/api/opportunities";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export function CreateOpportunityPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    company: "",
    type: "JOB",
    location: "",
    deadline: "",
    description: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => opportunitiesApi.createOpportunity(form),
    onSuccess: (created) => navigate(`/opportunities/${created?.id ?? ""}`),
  });

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Back
      </button>
      <PageHeader title="Post Opportunity" subtitle="Create a new job or internship listing" />

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
      >
        <Field label="Title *">
          <input required value={form.title} onChange={set("title")} placeholder="e.g. Software Engineering Intern" className={inputCls} />
        </Field>
        <Field label="Company *">
          <input required value={form.company} onChange={set("company")} placeholder="e.g. Google" className={inputCls} />
        </Field>
        <Field label="Type">
          <select value={form.type} onChange={set("type")} className={inputCls}>
            <option value="JOB">Job</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </Field>
        <Field label="Location">
          <input value={form.location} onChange={set("location")} placeholder="e.g. Colombo, Sri Lanka (or Remote)" className={inputCls} />
        </Field>
        <Field label="Application Deadline">
          <input type="date" value={form.deadline} onChange={set("deadline")} className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={set("description")} rows={5} placeholder="Job description, requirements, etc." className={`${inputCls} resize-none`} />
        </Field>

        {mutation.isError && <p className="text-sm text-destructive">Failed to create. Please try again.</p>}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Post Opportunity"}
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
