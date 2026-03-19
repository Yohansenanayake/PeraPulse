import { getJson, postJson, putJson, deleteJson } from "./http-client";

export const eventsApi = {
  getEvents: (upcoming = false) =>
    getJson(`/api/events${upcoming ? "?upcoming=true" : ""}`),

  getEvent: (id) => getJson(`/api/events/${id}`),

  createEvent: (data) => postJson("/api/events", data),

  updateEvent: (id, data) => putJson(`/api/events/${id}`, data),

  deleteEvent: (id) => deleteJson(`/api/events/${id}`),

  rsvp: (eventId, status) =>
    postJson(`/api/events/${eventId}/rsvp`, { status }),

  getAttendees: (eventId) => getJson(`/api/events/${eventId}/attendees`),

  getMyRsvps: () => getJson("/api/events/me/rsvps"),
};
