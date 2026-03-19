import { AuthProvider } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { oidcConfig } from "@/auth/oidc-config";
import { setAccessTokenProvider } from "@/api/http-client";

const userStore = new WebStorageStateStore({ store: window.sessionStorage });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider
        {...oidcConfig}
        userStore={userStore}
        onSigninCallback={handleSigninCallback}
      >
        <QueryClientProvider client={queryClient}>
          <HttpClientAuthBridge>{children}</HttpClientAuthBridge>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function handleSigninCallback() {
  const targetUrl =
    sessionStorage.getItem("perapulse.post_login_path") || "/feed";
  sessionStorage.removeItem("perapulse.post_login_path");
  window.history.replaceState({}, document.title, targetUrl);
}

function HttpClientAuthBridge({ children }) {
  const auth = useAuth();

  useEffect(() => {
    setAccessTokenProvider(() => auth.user?.access_token ?? null);
    return () => setAccessTokenProvider(() => null);
  }, [auth.user]);

  return children;
}
