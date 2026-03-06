import { useMemo } from "react";
import { useAuth } from "react-oidc-context";

export function useAuthState() {
  const auth = useAuth();

  const userLabel = useMemo(() => {
    const profile = auth.user?.profile;
    return (
      profile?.preferred_username ||
      profile?.email ||
      profile?.sub ||
      "unknown user"
    );
  }, [auth.user]);

  return {
    auth,
    ready: !auth.isLoading,
    userLabel,
    login: () => {
      sessionStorage.setItem(
        "perapulse.post_login_path",
        window.location.pathname + window.location.search
      );
      auth.signinRedirect();
    },
    logout: () => auth.signoutRedirect(),
    accessToken: auth.user?.access_token ?? null,
  };
}
