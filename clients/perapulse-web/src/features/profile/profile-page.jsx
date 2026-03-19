import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Linkedin, GraduationCap, User } from "lucide-react";
import { profilesApi } from "@/api/profiles";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";

const ROLE_STYLES = {
  STUDENT: "bg-primary/15 text-primary",
  ALUMNI: "bg-amber-100 text-amber-700",
  ADMIN: "bg-red-100 text-red-700",
};

export function ProfilePage() {
  const { sub } = useParams();

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ["profile", sub],
    queryFn: () => profilesApi.getProfile(sub),
  });

  if (isLoading) return <div className="max-w-xl mx-auto"><LoadingSkeleton count={1} /></div>;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!profile) return null;

  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-5">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.displayName} className="size-20 rounded-2xl object-cover" />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <User className="size-10 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight truncate">{profile.displayName ?? "Unknown User"}</h1>
            <p className="text-sm text-muted-foreground">{profile.email ?? ""}</p>
            {profile.role && (
              <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_STYLES[profile.role] ?? "bg-muted text-muted-foreground"}`}>
                {profile.role}
              </span>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-5 border-t border-border pt-5 text-sm leading-7 text-foreground">{profile.bio}</p>
        )}

        <div className="mt-5 space-y-2 border-t border-border pt-5">
          {profile.department && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="size-4" />
              <span>{profile.department}</span>
              {profile.gradYear && <span>· Class of {profile.gradYear}</span>}
            </div>
          )}
          {profile.linkedinUrl && (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Linkedin className="size-4" /> LinkedIn Profile
            </a>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Member since {profile.createdAt ? format(new Date(profile.createdAt), "MMMM yyyy") : "—"}
        </p>
      </div>
    </div>
  );
}
