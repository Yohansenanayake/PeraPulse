export const oidcConfig = {
  authority:
    import.meta.env.VITE_OIDC_AUTHORITY ??
    "http://localhost:8080/auth/realms/perapulse",
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID ?? "perapulse-react-web",
  redirect_uri:
    import.meta.env.VITE_OIDC_REDIRECT_URI ?? "http://localhost:5173/",
  post_logout_redirect_uri:
    import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI ??
    "http://localhost:5173/",
  response_type: "code",
  scope: "openid profile email",
  automaticSilentRenew: false,
  revokeTokensOnSignout: true,
  loadUserInfo: false,
};
