import { getJson, putJson, postJson } from "./http-client";

export const profilesApi = {
  getMyProfile: () => getJson("/api/profiles/me"),

  updateMyProfile: (data) => putJson("/api/profiles/me", data),

  getProfile: (sub) => getJson(`/api/profiles/${sub}`),

  // Admin
  getUsers: (role) =>
    getJson(`/api/admin/users${role ? `?role=${role}` : ""}`),

  getUser: (sub) => getJson(`/api/admin/users/${sub}`),

  // Role requests
  submitRoleRequest: (data) => postJson("/api/profiles/role-requests", data),

  getRoleRequests: (status) =>
    getJson(`/api/admin/role-requests${status ? `?status=${status}` : ""}`),

  approveRoleRequest: (id) =>
    putJson(`/api/admin/role-requests/${id}/approve`),

  rejectRoleRequest: (id) =>
    putJson(`/api/admin/role-requests/${id}/reject`),
};
