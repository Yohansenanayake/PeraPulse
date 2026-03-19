import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit3, Eye, Save, X } from "lucide-react";

import { getErrorMessage } from "@/api/http-client";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/features/profile/profile-card";
import {
  useMyProfile,
  useUpdateMyProfile,
} from "@/features/user-service/use-user-service";

function toFormState(profile) {
  return {
    displayName: profile?.displayName ?? "",
    bio: profile?.bio ?? "",
    department: profile?.department ?? "",
    gradYear: profile?.gradYear?.toString() ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    avatarUrl: profile?.avatarUrl ?? "",
  };
}

function toPayload(form) {
  return {
    displayName: form.displayName.trim() || null,
    bio: form.bio.trim() || null,
    department: form.department.trim() || null,
    gradYear: form.gradYear ? Number(form.gradYear) : null,
    linkedinUrl: form.linkedinUrl.trim() || null,
    avatarUrl: form.avatarUrl.trim() || null,
  };
}

export function EditProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(toFormState(null));

  useEffect(() => {
    if (profile) {
      setForm(toFormState(profile));
    }
  }, [profile]);

  const publicProfilePath = useMemo(
    () => (profile?.keycloakSub ? `/profile/${profile.keycloakSub}` : null),
    [profile]
  );

  const isDirty = profile
    ? JSON.stringify(toPayload(form)) !==
      JSON.stringify(toPayload(toFormState(profile)))
    : false;

  const setField = (key) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCancel = () => {
    setForm(toFormState(profile));
    setIsEditing(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateProfile.mutate(toPayload(form), {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <LoadingSkeleton count={1} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          message={getErrorMessage(error, "Unable to load your profile.")}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Review your public profile and switch into edit mode when you want to update it."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {publicProfilePath ? (
              <Link to={publicProfilePath}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Eye className="size-4" />
                  View Public Profile
                </Button>
              </Link>
            ) : null}
            {!isEditing ? (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="size-4" />
                Edit Profile
              </Button>
            ) : null}
          </div>
        }
      />

      <ProfileCard
        profile={profile}
        subtitle="This is the data other users will see, with sensitive fields hidden on public pages."
        showEmail
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Edit details
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep your profile current so students, alumni, and admins see accurate information.
            </p>
          </div>
          {isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="gap-1.5"
            >
              <X className="size-4" />
              Cancel
            </Button>
          ) : null}
        </div>

        {!isEditing ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
            Edit mode is off. Use the button above when you want to update your
            display name, department, graduation year, bio, LinkedIn URL, or
            avatar URL.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Display Name">
              <input
                value={form.displayName}
                onChange={setField("displayName")}
                placeholder="Your name"
                className={inputCls}
              />
            </Field>

            <Field label="Bio">
              <textarea
                value={form.bio}
                onChange={setField("bio")}
                rows={4}
                placeholder="A short bio about yourself."
                className={`${inputCls} resize-none`}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Department">
                <input
                  value={form.department}
                  onChange={setField("department")}
                  placeholder="Computer Engineering"
                  className={inputCls}
                />
              </Field>

              <Field label="Graduation Year">
                <input
                  type="number"
                  min={1950}
                  max={2100}
                  value={form.gradYear}
                  onChange={setField("gradYear")}
                  placeholder="2024"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="LinkedIn URL">
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={setField("linkedinUrl")}
                placeholder="https://linkedin.com/in/your-profile"
                className={inputCls}
              />
            </Field>

            <Field label="Avatar URL">
              <input
                type="url"
                value={form.avatarUrl}
                onChange={setField("avatarUrl")}
                placeholder="https://example.com/avatar.jpg"
                className={inputCls}
              />
            </Field>

            {updateProfile.isSuccess ? (
              <p className="text-sm font-medium text-emerald-600">
                Profile saved successfully.
              </p>
            ) : null}

            {updateProfile.isError ? (
              <p className="text-sm text-destructive">
                {getErrorMessage(
                  updateProfile.error,
                  "We couldn't save your profile."
                )}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateProfile.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-1.5"
                disabled={updateProfile.isPending || !isDirty}
              >
                <Save className="size-4" />
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
