import { getJson, postJson, putJson, deleteJson, patchJson } from "./http-client";

export const opportunitiesApi = {
  // Opportunities
  getOpportunities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return getJson(`/api/opportunities${query ? `?${query}` : ""}`);
  },

  getOpportunity: (id) => getJson(`/api/opportunities/${id}`),

  createOpportunity: (data) => postJson("/api/opportunities", data),

  updateOpportunity: (id, data) => putJson(`/api/opportunities/${id}`, data),

  deleteOpportunity: (id) => deleteJson(`/api/opportunities/${id}`),

  // Applications
  applyToOpportunity: (id, data) =>
    postJson(`/api/opportunities/${id}/apply`, data),

  getApplications: (opportunityId) =>
    getJson(`/api/opportunities/${opportunityId}/applications`),

  getMyApplications: () => getJson("/api/applications/me"),

  updateApplicationStatus: (appId, status) =>
    putJson(`/api/applications/${appId}/status`, { status }),
};
