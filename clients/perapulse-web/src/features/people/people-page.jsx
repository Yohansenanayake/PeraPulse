import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users } from "lucide-react";

import { getErrorMessage } from "@/api/http-client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { usePublicProfile } from "@/features/user-service/use-user-service";

export function PeoplePage() {
  const [inputValue, setInputValue] = useState("");
  const [searchSub, setSearchSub] = useState("");

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = usePublicProfile(searchSub);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSearchSub(inputValue.trim());
  };

  const hasSearched = Boolean(searchSub);

  return (
    <div className="space-y-8">
      <PageHeader
        title="People"
        subtitle="Enter an exact username or email subject to open a public profile."
      />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Exact Subject Lookup
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Example: student1@eng.pdn.ac.lk"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!inputValue.trim()}>
              Search Profile
            </Button>
            {hasSearched ? (
              <p className="text-sm text-muted-foreground">
                Searching for exact subject: <span className="font-medium text-foreground">{searchSub}</span>
              </p>
            ) : null}
          </div>
        </form>

        <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
          Search other people using their usernames or email address.
        </div>
      </div>

      {!hasSearched ? (
        <EmptyState
          icon={Users}
          title="Search for a person"
          description="Type the exact username or email subject, then open the public profile from the result."
        />
      ) : null}

      {hasSearched && isLoading ? <LoadingSkeleton count={1} /> : null}

      {hasSearched && isError ? (
        <ErrorState
          message={getErrorMessage(
            error,
            error?.status === 404
              ? "No public profile was found for that exact subject."
              : "Unable to load that public profile right now."
          )}
          onRetry={refetch}
        />
      ) : null}

      {hasSearched && !isLoading && !isError && profile ? (
        <PeopleResultCard profile={profile} />
      ) : null}
    </div>
  );
}

function PeopleResultCard({ profile }) {
  return (
    <Link
      to={`/profile/${profile.keycloakSub}`}
      className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:border-primary/40"
    >
      <div className="flex items-start gap-4">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.displayName ?? "Profile avatar"}
            className="size-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Users className="size-7" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-foreground">
            {profile.displayName ?? "Unnamed User"}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            {profile.role ?? "Member"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Subject: {profile.keycloakSub}
          </p>
          {profile.department ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {profile.department}
            </p>
          ) : null}
          {profile.bio ? (
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
              {profile.bio}
            </p>
          ) : null}
          <p className="mt-4 text-sm font-medium text-primary">
            Open Public Profile
          </p>
        </div>
      </div>
    </Link>
  );
}
