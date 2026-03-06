import { useState } from "react";
import { LockKeyhole, Network, UserRoundCheck } from "lucide-react";

import { getJson } from "@/api/http-client";
import { useAuthState } from "@/auth/use-auth-state";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  const { auth, accessToken, login, logout, ready, userLabel } = useAuthState();
  const [apiResult, setApiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handlePublicCall() {
    setIsLoading(true);
    try {
      const result = await getJson("/api/users/public-info");
      setApiResult({ status: "success", title: "Public endpoint", payload: result });
    } catch (error) {
      setApiResult({
        status: "error",
        title: "Public endpoint",
        payload: formatError(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProtectedCall() {
    setIsLoading(true);
    try {
      const result = await getJson("/api/users/info");
      setApiResult({
        status: "success",
        title: "Protected endpoint",
        payload: result,
      });
    } catch (error) {
      setApiResult({
        status: "error",
        title: "Protected endpoint",
        payload: formatError(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
      <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.45)]">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Actions
        </p>

        <div className="mt-5 space-y-3">
          {auth.isAuthenticated ? (
            <Button className="w-full justify-center" onClick={logout}>
              Log out
            </Button>
          ) : (
            <Button className="w-full justify-center" onClick={login}>
              Sign in with Keycloak
            </Button>
          )}

            <Button
            className="w-full justify-center"
            variant="outline"
            onClick={handlePublicCall}
            disabled={isLoading}
          >
            Call public endpoint
          </Button>

          <Button
            className="w-full justify-center"
            variant="secondary"
            onClick={handleProtectedCall}
            disabled={isLoading || !accessToken}
          >
            Call protected endpoint
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          <SessionBadge
            icon={UserRoundCheck}
            label="User"
            value={ready ? (auth.isAuthenticated ? userLabel : "Not signed in") : "Loading"}
          />
          <SessionBadge
            icon={LockKeyhole}
            label="Access token"
            value={accessToken ? "Available" : "Missing"}
          />
          <SessionBadge
            icon={Network}
            label="Gateway"
            value={import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}
          />
        </div>
      </div>

      <div className="rounded-[2rem] border border-border/70 bg-background/88 p-6 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
              API results
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Validate the same auth slice from React
            </h2>
          </div>
          {isLoading ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              Working...
            </span>
          ) : null}
        </div>

        <pre className="mt-6 min-h-72 overflow-auto rounded-[1.5rem] border border-border/70 bg-card px-5 py-4 text-sm leading-6 text-foreground">
          {apiResult
            ? JSON.stringify(apiResult, null, 2)
            : `No request made yet.\n\nUse the public and protected actions on the left to verify the React client against the existing gateway and user-service flow.`}
        </pre>

        <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-card px-5 py-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Auth diagnostics
          </p>
          <pre className="mt-3 overflow-auto text-sm leading-6 text-foreground">
            {JSON.stringify(
              {
                isLoading: auth.isLoading,
                isAuthenticated: auth.isAuthenticated,
                activeNavigator: auth.activeNavigator ?? null,
                hasAccessToken: Boolean(accessToken),
                error: auth.error
                  ? {
                      name: auth.error.name,
                      message: auth.error.message,
                    }
                  : null,
                profile: auth.user?.profile ?? null,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </section>
  );
}

function SessionBadge({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function formatError(error) {
  return {
    message: error.message,
    status: error.status ?? null,
    payload: error.data ?? null,
  };
}
