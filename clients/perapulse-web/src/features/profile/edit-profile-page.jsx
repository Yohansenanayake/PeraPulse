import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { profilesApi } from "@/api/profiles";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";

export function EditProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => profilesApi.getMyProfile(),
  });

  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    department: "",
    gradYear: "",
    linkedinUrl: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName ?? "",
        bio: profile.bio ?? "",
        department: profile.department ?? "",
        gradYear: profile.gradYear ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        avatarUrl: profile.avatarUrl ?? "",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () => profilesApi.updateMyProfile(form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-profile"] }),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (isLoading) return <LoadingSkeleton count={1} />;

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title="Edit Profile" subtitle="Update your public profile details" />

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
      >
        <Field label="Display Name">
          <input value={form.displayName} onChange={set("displayName")} placeholder="Your name" className={inputCls} />
        </Field>
        <Field label="Bio">
          <textarea value={form.bio} onChange={set("bio")} rows={3} placeholder="A short bio about yourself…" className={`${inputCls} resize-none`} />
        </Field>
        <Field label="Department">
          <input value={form.department} onChange={set("department")} placeholder="e.g. Computer Engineering" className={inputCls} />
        </Field>
        <Field label="Graduation Year">
          <input type="number" value={form.gradYear} onChange={set("gradYear")} placeholder="e.g. 2024" className={inputCls} />
        </Field>
        <Field label="LinkedIn URL">
          <input type="url" value={form.linkedinUrl} onChange={set("linkedinUrl")} placeholder="https://linkedin.com/in/…" className={inputCls} />
        </Field>
        <Field label="Avatar URL">
          <input type="url" value={form.avatarUrl} onChange={set("avatarUrl")} placeholder="https://…/avatar.jpg" className={inputCls} />
        </Field>

        {mutation.isSuccess && <p className="text-sm text-emerald-600 font-medium">Profile saved!</p>}
        {mutation.isError && <p className="text-sm text-destructive">Failed to save. Please try again.</p>}

        <Button type="submit" className="w-full gap-1.5" disabled={mutation.isPending}>
          <Save className="size-4" />
          {mutation.isPending ? "Saving…" : "Save Changes"}
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
