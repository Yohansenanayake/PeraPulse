import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users } from "lucide-react";

import { getErrorMessage } from "@/api/http-client";
import { useUiStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { usePublicProfile } from "@/features/user-service/use-user-service";

export function PeoplePage() {
  const { darkMode } = useUiStore();
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
        subtitle="Find a public profile by entering the exact username or email subject."
      />

      <div className={`overflow-hidden rounded-3xl border shadow-sm ${darkMode ? 'border-cyan-500/20 bg-gradient-to-br from-slate-900/50 to-blue-900/30' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white'}`}>
        <div className={`border-b px-5 py-4 ${darkMode ? 'border-cyan-500/10 bg-gradient-to-br from-slate-900/80 to-blue-900/60' : 'border-blue-200 bg-blue-50'}`}>
          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Exact subject lookup
          </p>
          <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Use the full subject, for example{" "}
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              student1@eng.pdn.ac.lk
            </span>
            .
          </p>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`mb-2 block text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Subject
              </label>
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${darkMode ? 'border-cyan-500/20 bg-slate-800/50' : 'border-blue-200 bg-white'}`}>
                <Search className={`size-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                <input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Example: student1@eng.pdn.ac.lk"
                  className={`w-full bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder:text-slate-400' : 'text-slate-900 placeholder:text-slate-500'}`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={!inputValue.trim()}>
                Find Profile
              </Button>
              <button
                type="button"
                onClick={() => {
                  setInputValue("student1@eng.pdn.ac.lk");
                  setSearchSub("student1@eng.pdn.ac.lk");
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${darkMode ? 'border-cyan-500/20 bg-slate-800/50 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300' : 'border-blue-200 bg-blue-50 text-slate-600 hover:border-blue-400 hover:text-blue-600'}`}
              >
                Try demo subject
              </button>
              {hasSearched ? (
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Current lookup:{" "}
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{searchSub}</span>
                </p>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      {!hasSearched ? (
        <EmptyState
          icon={Users}
          title="Search for a person"
          description="Enter the exact subject, then open the matching public profile from the result."
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
        <PeopleResultCard profile={profile} darkMode={darkMode} />
      ) : null}
    </div>
  );
}

function PeopleResultCard({ profile, darkMode }) {
  return (
    <Link
      to={`/profile/${profile.keycloakSub}`}
      className={`block rounded-3xl border p-5 shadow-sm transition-transform ${darkMode ? 'border-cyan-500/20 bg-gradient-to-br from-slate-900/50 to-blue-900/30 hover:border-cyan-400/40 hover:shadow-lg' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5'}`}
    >
      <div className="flex items-start gap-4">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.displayName ?? "Profile avatar"}
            className="size-16 rounded-2xl object-cover"
          />
        ) : (
          <div className={`flex size-16 items-center justify-center rounded-2xl ${darkMode ? 'bg-cyan-600/20 text-cyan-400' : 'bg-blue-100 text-blue-600'}`}>
            <Users className="size-7" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className={`truncate text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {profile.displayName ?? "Unnamed User"}
          </p>
          <p className={`mt-1 text-xs uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {profile.role ?? "Member"}
          </p>
          <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{profile.keycloakSub}</p>
          {profile.department ? (
            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {profile.department}
            </p>
          ) : null}
          {profile.bio ? (
            <p className={`mt-2 line-clamp-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {profile.bio}
            </p>
          ) : null}
          <p className={`mt-4 text-sm font-medium ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
            Open Public Profile
          </p>
        </div>
      </div>
    </Link>
  );
}
