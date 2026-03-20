export const MOCK_EVENTS = [
  {
    id: "career-fair-2026",
    title: "PeraPulse Career Fair 2026",
    startTime: "2026-04-05T09:00:00+05:30",
    endTime: "2026-04-05T15:00:00+05:30",
    venue: "Faculty of Engineering Main Hall",
    description:
      "Meet alumni, hiring partners, and student founders for a full day of networking, mock interviews, and internship conversations.\n\nHighlights include recruiter office hours, CV feedback booths, and a lightning panel on standing out as a fresh graduate.",
    bannerUrl:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    myRsvp: "GOING",
    createdBySub: "demo-admin",
  },
  {
    id: "startup-night",
    title: "Startup Night: Founders From Pera",
    startTime: "2026-04-12T17:30:00+05:30",
    endTime: "2026-04-12T20:00:00+05:30",
    venue: "New Arts Theatre",
    description:
      "An evening fireside chat with alumni founders building in fintech, agritech, and healthtech.\n\nExpect candid stories about first customers, fundraising, mistakes, and what student builders should focus on early.",
    bannerUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    myRsvp: "MAYBE",
    createdBySub: "demo-admin",
  },
  {
    id: "ai-workshop",
    title: "AI Resume and Portfolio Workshop",
    startTime: "2026-04-18T10:00:00+05:30",
    endTime: "2026-04-18T12:30:00+05:30",
    venue: "Computer Engineering Lab 2",
    description:
      "A hands-on workshop for final-year students on building sharper resumes, stronger portfolios, and better project narratives.\n\nBring your laptop and one project you want to present better.",
    bannerUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    myRsvp: null,
    createdBySub: "demo-admin",
  },
  {
    id: "alumni-mixer",
    title: "Alumni Mixer and Mentorship Meetup",
    startTime: "2026-03-01T18:00:00+05:30",
    endTime: "2026-03-01T21:00:00+05:30",
    venue: "Senate Building Courtyard",
    description:
      "A casual mixer for current students and alumni mentors to connect across departments and career stages.\n\nThis session focused on mentorship matching, informal networking, and summer planning.",
    bannerUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    myRsvp: "GOING",
    createdBySub: "demo-admin",
  },
];

export function getMockEvents(upcomingOnly = true) {
  const now = new Date();

  if (!upcomingOnly) {
    return MOCK_EVENTS;
  }

  return MOCK_EVENTS.filter((event) => {
    if (!event.startTime) return true;
    return new Date(event.startTime) >= now;
  });
}

export function getMockEventById(id) {
  return MOCK_EVENTS.find((event) => event.id === id) ?? null;
}
