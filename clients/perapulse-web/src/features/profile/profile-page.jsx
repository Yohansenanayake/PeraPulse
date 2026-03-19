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
    <div className="mx-auto max-w-xl">
      <ProfileCard
        profile={profile}
        subtitle="Public profile"
        showEmail={false}
      />
    </div>
  );
}
