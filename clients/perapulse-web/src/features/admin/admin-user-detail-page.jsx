import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { getErrorMessage } from "@/api/http-client";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/features/profile/profile-card";
import { useAdminUser } from "@/features/user-service/use-user-service";

export function AdminUserDetailPage() {
  const { sub } = useParams();
  const { data: user, isLoading, isError, error, refetch } = useAdminUser(sub);

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
          message={getErrorMessage(
            error,
            error?.status === 404
              ? "That user profile does not exist."
              : "Unable to load this user right now."
          )}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="User Details"
        subtitle="Admin-only profile view backed by the user-service admin endpoint."
        actions={
          <Link to="/admin/users">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="size-4" />
              Back to Users
            </Button>
          </Link>
        }
      />

      <ProfileCard
        profile={user}
        subtitle={`Subject: ${user.keycloakSub}`}
        showEmail
      />
    </div>
  );
}
