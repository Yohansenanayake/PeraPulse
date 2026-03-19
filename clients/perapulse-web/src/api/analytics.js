import { getJson } from "./http-client";

export const analyticsApi = {
  getSummary: () => getJson("/api/analytics/summary"),

  getDaily: (from, to) =>
    getJson(`/api/analytics/daily?from=${from}&to=${to}`),

  getTopPosts: (limit = 5) =>
    getJson(`/api/analytics/top-posts?limit=${limit}`),
};
