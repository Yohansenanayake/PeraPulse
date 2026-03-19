import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  GraduationCap,
  RefreshCcw,
  XCircle,
} from "lucide-react";

import { getErrorMessage } from "@/api/http-client";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  useMyProfile,
  useSubmitRoleRequest,
} from "@/features/user-service/use-user-service";

const LOCAL_STORAGE_PREFIX = "perapulse.role-request";

function getStorageKey(userSub) {
  return `${LOCAL_STORAGE_PREFIX}.${userSub}`;
}

function readStoredRequest(userSub) {
  if (!userSub) return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(userSub));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredRequest(userSub, request) {
  if (!userSub || !request) return;
  window.localStorage.setItem(getStorageKey(userSub), JSON.stringify(request));
}

function clearStoredRequest(userSub) {
  if (!userSub) return;
  window.localStorage.removeItem(getStorageKey(userSub));
}

export function RoleRequestPage() {
  const { data: profile, isLoading, isError, error, refetch } = useMyProfile();
  const [form, setForm] = useState({ graduationYear: "", evidenceText: "" });
  const [localRequest, setLocalRequest] = useState(null);
  const [conflictMessage, setConflictMessage] = useState("");

  useEffect(() => {
    if (!profile?.keycloakSub) return;
    setLocalRequest(readStoredRequest(profile.keycloakSub));
  }, [profile?.keycloakSub]);

  useEffect(() => {
    if (!profile?.keycloakSub) return;

    if (profile.role === "ALUMNI" || profile.role === "ADMIN") {
      clearStoredRequest(profile.keycloakSub);
      setLocalRequest(null);
      setConflictMessage("");
    }
  }, [profile?.keycloakSub, profile?.role]);

  const submitRoleRequest = useSubmitRoleRequest({
    onSuccess: (request) => {
      if (profile?.keycloakSub) {
        writeStoredRequest(profile.keycloakSub, request);
      }
      setLocalRequest(request);
      setConflictMessage("");
    },
    onError: (submitError) => {
      if (submitError?.status === 409) {
        setConflictMessage(
          getErrorMessage(
            submitError,
            "You already have a pending alumni role request."
          )
        );
      }
    },
  });

  const currentStatus = useMemo(() => {
    if (profile?.role === "ALUMNI" || profile?.role === "ADMIN") {
      return "APPROVED";
    }

    if (localRequest?.status) {
      return localRequest.status;
    }

    if (conflictMessage) {
      return "PENDING";
    }

    return "NONE";
  }, [conflictMessage, localRequest?.status, profile?.role]);

  const disableSubmit = currentStatus === "PENDING";

  const handleSubmit = (event) => {
    event.preventDefault();
    setConflictMessage("");

    submitRoleRequest.mutate({
      graduationYear: Number(form.graduationYear),
      evidenceText: form.evidenceText.trim() || null,
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl">
        <LoadingSkeleton count={1} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState
          message={getErrorMessage(
            error,
            "Unable to load your profile details."
          )}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Request Alumni Status"
        subtitle="Submit your graduation details to request an upgrade from Student to Alumni."
      />

      <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 p-4 text-sm text-amber-800">
        <p className="mb-1 font-semibold">After approval</p>
        <p>
          You must log out and log back in so Keycloak can issue a new token
          with your updated role.
        </p>
      </div>

      {currentStatus === "APPROVED" ? (
        <StatusCard
          icon={RefreshCcw}
          title="Your profile has already been upgraded"
          description="Your user-service profile already shows Alumni access. Refresh your session by logging out and back in to receive the new JWT role."
          tone="success"
        />
      ) : null}

      {currentStatus === "PENDING" ? (
        <StatusCard
          icon={Clock3}
          title="Your alumni request is pending review"
          description={
            localRequest?.graduationYear
              ? `Graduation year submitted: ${localRequest.graduationYear}. An admin still needs to review the request.`
              : conflictMessage ||
                "An admin still needs to review your existing request."
          }
          tone="warning"
        />
      ) : null}

      {currentStatus === "REJECTED" ? (
        <StatusCard
          icon={XCircle}
          title="Your previous request was rejected"
          description="You can submit a new request with clearer evidence or corrected graduation details."
          tone="danger"
        />
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Graduation Year *
          </label>
          <input
            required
            type="number"
            min={1950}
            max={2100}
            value={form.graduationYear}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                graduationYear: event.target.value,
              }))
            }
            placeholder="2024"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={
              disableSubmit ||
              submitRoleRequest.isPending ||
              currentStatus === "APPROVED"
            }
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Supporting Evidence (optional)
          </label>
          <textarea
            value={form.evidenceText}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                evidenceText: event.target.value,
              }))
            }
            rows={4}
            placeholder="LinkedIn profile, a graduation note, or another short proof."
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={
              disableSubmit ||
              submitRoleRequest.isPending ||
              currentStatus === "APPROVED"
            }
          />
        </div>

        {submitRoleRequest.isError ? (
          <p className="text-sm text-destructive">
            {conflictMessage ||
              getErrorMessage(
                submitRoleRequest.error,
                "We couldn't submit your request."
              )}
          </p>
        ) : null}

        {currentStatus === "REJECTED" ? (
          <p className="text-sm text-muted-foreground">
            You can update the form and submit again when you are ready.
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full gap-1.5"
          disabled={
            disableSubmit ||
            submitRoleRequest.isPending ||
            currentStatus === "APPROVED"
          }
        >
          <GraduationCap className="size-4" />
          {submitRoleRequest.isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
    </div>
  );
}

function StatusCard({ icon: Icon, title, description, tone }) {
  const tones = {
    success: "border-emerald-300/60 bg-emerald-50 text-emerald-800",
    warning: "border-amber-300/60 bg-amber-50 text-amber-800",
    danger: "border-red-300/60 bg-red-50 text-red-800",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white/60">
        <Icon className="size-6" />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6">{description}</p>
    </div>
  );
}
