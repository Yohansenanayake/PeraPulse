import { AuthProvider } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

import { oidcConfig } from "@/auth/oidc-config";
import { setAccessTokenProvider } from "@/api/http-client";

const userStore = new WebStorageStateStore({
  store: window.sessionStorage,
});

export function AppProviders({ children }) {
  return (
    <AuthProvider
      {...oidcConfig}
      userStore={userStore}
      onSigninCallback={handleSigninCallback}
    >
      <HttpClientAuthBridge>{children}</HttpClientAuthBridge>
    </AuthProvider>
  );
}

function handleSigninCallback() {
  const targetUrl = sessionStorage.getItem("perapulse.post_login_path") || "/";
  sessionStorage.removeItem("perapulse.post_login_path");
  window.history.replaceState({}, document.title, targetUrl);
}

function HttpClientAuthBridge({ children }) {
  const auth = useAuth();

  useEffect(() => {
    setAccessTokenProvider(() => auth.user?.access_token ?? null);

    return () => {
      setAccessTokenProvider(() => null);
    };
  }, [auth.user]);

  return children;
}
