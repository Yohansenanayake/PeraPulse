import { ShieldCheck, SatelliteDish, Sparkles } from "lucide-react";

import { useAuthState } from "@/auth/use-auth-state";
import { Button } from "@/components/ui/button";
import { LandingPage } from "@/features/home/landing-page";

export function AppShell() {
  const { auth, login, logout, ready, userLabel } = useAuthState();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(202,138,4,0.18),_transparent_30%),linear-gradient(180deg,_#f6f0df_0%,_#f7f4ed_48%,_#fbfaf6_100%)] text-foreground">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">PeraPulse</p>
              <p className="text-sm text-muted-foreground">
                Department engagement platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-border bg-background/80 px-3 py-1.5 text-sm text-muted-foreground sm:block">
              {ready
                ? auth.isAuthenticated
                  ? `Signed in as ${userLabel}`
                  : "Not signed in"
                : "Checking session..."}
            </div>
            {auth.isAuthenticated ? (
              <Button variant="outline" onClick={logout}>
                Log out
              </Button>
            ) : (
              <Button onClick={login}>Sign in</Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-100/70 px-3 py-1 text-sm text-amber-900">
              <ShieldCheck className="size-4" />
              React web client auth slice
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Replace the temporary test page with a real frontend without
                changing the security model.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                This React client keeps the same Keycloak, gateway, and
                downstream JWT validation flow you already proved. The next step
                is making the browser experience feel like the real product.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard
                icon={ShieldCheck}
                title="Access token only"
                description="Browser to gateway and gateway to services both use the same access token."
              />
              <InfoCard
                icon={SatelliteDish}
                title="Gateway first"
                description="Browser-facing auth and API traffic still enter through the gateway path."
              />
              <InfoCard
                icon={Sparkles}
                title="React native flow"
                description="The temp page can stay as a fallback while this app takes over the login flow."
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-background/85 p-6 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.4)]">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Current session
            </p>
            <div className="mt-4 space-y-4">
              <StatusRow
                label="Auth state"
                value={
                  ready
                    ? auth.isAuthenticated
                      ? "Authenticated"
                      : "Anonymous"
                    : "Resolving"
                }
              />
              <StatusRow label="Client" value="React + Vite" />
              <StatusRow
                label="Authority"
                value={import.meta.env.VITE_OIDC_AUTHORITY ??
                  "http://localhost:8080/auth/realms/perapulse"}
              />
              <StatusRow
                label="API base"
                value={import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}
              />
            </div>
          </div>
        </section>

        <LandingPage />
      </main>
    </div>
  );
}

function InfoCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/75 p-4">
      <div className="mb-4 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-medium">{value}</p>
    </div>
  );
}
