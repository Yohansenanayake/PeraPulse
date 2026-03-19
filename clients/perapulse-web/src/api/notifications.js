import { getJson, postJson } from "./http-client";

export const notificationsApi = {
  getNotifications: (page = 0, size = 20) =>
    getJson(`/api/notifications?page=${page}&size=${size}`),

  getUnreadCount: () => getJson("/api/notifications/unread-count"),

  markRead: (id) => postJson(`/api/notifications/${id}/read`),

  markAllRead: () => postJson("/api/notifications/read-all"),
};
