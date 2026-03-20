import { format } from "date-fns";
import { GraduationCap, Linkedin, Mail, User } from "lucide-react";

const ROLE_STYLES = {
  STUDENT: "bg-primary/15 text-primary",
  ALUMNI: "bg-amber-100 text-amber-700",
  ADMIN: "bg-red-100 text-red-700",
};

export function ProfileCard({
  profile,
  subtitle,
  actions,
  showEmail = false,
  showMemberSince = true,
}) {
  if (!profile) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/70 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.14),_transparent_28rem),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_24rem)] px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-5">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName ?? "User avatar"}
                className="size-20 rounded-3xl border border-border/60 object-cover shadow-sm"
              />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-primary/15 shadow-inner">
                <User className="size-10 text-primary" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
                {profile.displayName ?? "Unnamed User"}
              </h1>

              {subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}

              {showEmail && profile.email ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-4" />
                  <span className="truncate">{profile.email}</span>
                </p>
              ) : null}

              {profile.role ? (
                <span
                  className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    ROLE_STYLES[profile.role] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {profile.role}
                </span>
              ) : null}
            </div>
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>

      <div className="px-6 py-6">
        {profile.bio ? (
          <p className="text-sm leading-7 text-foreground">{profile.bio}</p>
        ) : null}

        {profile.department || profile.gradYear || profile.linkedinUrl ? (
          <div className={`grid gap-3 ${profile.bio ? "mt-5 border-t border-border pt-5" : ""}`}>
            {profile.department || profile.gradYear ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="size-4" />
                <span>{profile.department || "Department not set"}</span>
                {profile.gradYear ? <span>- Class of {profile.gradYear}</span> : null}
              </div>
            ) : null}

            {profile.linkedinUrl ? (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Linkedin className="size-4" />
                LinkedIn Profile
              </a>
            ) : null}
          </div>
        ) : null}

        {showMemberSince ? (
          <p className="mt-5 text-xs text-muted-foreground">
            Member since{" "}
            {profile.createdAt
              ? format(new Date(profile.createdAt), "MMMM yyyy")
              : "-"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
