import { useParams } from "react-router-dom";

import { getErrorMessage } from "@/api/http-client";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ProfileCard } from "@/features/profile/profile-card";
import { usePublicProfile } from "@/features/user-service/use-user-service";

export function ProfilePage() {
  const { sub } = useParams();
  const { data: profile, isLoading, isError, error, refetch } =
    usePublicProfile(sub);

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
            error?.status === 404
              ? "We couldn't find that profile."
              : "Unable to load this profile right now."
          )}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="rounded-3xl border border-border/70 bg-card/70 px-5 py-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
          Public Profile
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          This page shows the public details this member has chosen to share.
        </p>
      </div>
      <ProfileCard
        profile={profile}
        subtitle="Public profile"
        showEmail={false}
      />
    </div>
  );
}
