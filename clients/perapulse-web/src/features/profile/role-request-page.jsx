import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { GraduationCap, ChevronRight } from "lucide-react";
import { profilesApi } from "@/api/profiles";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export function RoleRequestPage() {
  const [form, setForm] = useState({ graduationYear: "", evidenceText: "" });
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => profilesApi.submitRoleRequest({ ...form, graduationYear: parseInt(form.graduationYear) }),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-emerald-300/60 bg-emerald-50 p-10 text-center shadow-sm">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-100 mx-auto">
          <ChevronRight className="size-7 text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Request Submitted!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          An admin will review your alumni upgrade request. You'll receive a notification once a decision is made.
          After approval, please log out and log back in for your new role to take effect.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        title="Request Alumni Status"
        subtitle="Submit your graduation details to request an upgrade to Alumni role"
      />

      <div className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50/60 p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">⚠️ After approval</p>
        <p>You must log out and log back in for your new Alumni role JWT to be issued by Keycloak.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
      >
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Graduation Year *
          </label>
          <input
            required
            type="number"
            min={1990}
            max={new Date().getFullYear()}
            value={form.graduationYear}
            onChange={(e) => setForm((f) => ({ ...f, graduationYear: e.target.value }))}
            placeholder="e.g. 2024"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Supporting Evidence (optional)
          </label>
          <textarea
            value={form.evidenceText}
            onChange={(e) => setForm((f) => ({ ...f, evidenceText: e.target.value }))}
            rows={4}
            placeholder="LinkedIn profile, degree certificate URL, or any other evidence…"
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {mutation.isError && <p className="text-sm text-destructive">Submission failed. Please try again.</p>}

        <Button type="submit" className="w-full gap-1.5" disabled={mutation.isPending}>
          <GraduationCap className="size-4" />
          {mutation.isPending ? "Submitting…" : "Submit Request"}
        </Button>
      </form>
    </div>
  );
}
