import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Briefcase,
  CalendarDays,
  Clock3,
  Newspaper,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";

const SUMMARY_CARDS = [
  {
    label: "Total Users",
    value: "1,284",
    change: "+8.4% this month",
    icon: Users,
    tone: "bg-sky-100 text-sky-700",
  },
  {
    label: "Feed Posts",
    value: "342",
    change: "+26 this week",
    icon: Newspaper,
    tone: "bg-violet-100 text-violet-700",
  },
  {
    label: "Open Opportunities",
    value: "57",
    change: "12 awaiting review",
    icon: Briefcase,
    tone: "bg-amber-100 text-amber-700",
  },
  {
    label: "Upcoming Events",
    value: "14",
    change: "3 happening today",
    icon: CalendarDays,
    tone: "bg-emerald-100 text-emerald-700",
  },
];

const ACTIVITY_TREND = [
  { day: "Mon", signups: 18, posts: 9, applications: 6 },
  { day: "Tue", signups: 24, posts: 12, applications: 8 },
  { day: "Wed", signups: 21, posts: 14, applications: 11 },
  { day: "Thu", signups: 29, posts: 10, applications: 9 },
  { day: "Fri", signups: 33, posts: 16, applications: 14 },
  { day: "Sat", signups: 17, posts: 7, applications: 5 },
  { day: "Sun", signups: 22, posts: 11, applications: 7 },
];

const CONTENT_HEALTH = [
  { name: "Approved", count: 126 },
  { name: "Pending", count: 18 },
  { name: "Flagged", count: 5 },
];

const OPERATIONAL_ITEMS = [
  {
    title: "Role Requests",
    value: "11 pending",
    detail: "7 alumni verifications need review before end of day.",
    icon: ShieldAlert,
  },
  {
    title: "Moderation Queue",
    value: "5 flagged posts",
    detail: "2 were raised in the last hour and should be checked first.",
    icon: Activity,
  },
  {
    title: "Response Time",
    value: "1h 20m avg",
    detail: "Admin actions are staying within the current same-day target.",
    icon: Clock3,
  },
];

const CAMPUS_SIGNALS = [
  "Engineering alumni referrals are up compared to last week.",
  "Final-year student signups peaked after the careers noticeboard update.",
  "Event RSVPs are strongest for networking sessions and mock interviews.",
];

function StatCard({ icon: Icon, label, value, change, tone }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {change}
          </p>
        </div>
        <div className={`flex size-12 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Temporary hardcoded admin overview until live analytics is wired up."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Weekly Platform Activity
              </h2>
              <p className="text-sm text-muted-foreground">
                Mock signup, posting, and application volume for the past 7 days.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <TrendingUp className="size-3.5" />
              Healthy trend
            </span>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ACTIVITY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 265)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="signups"
                name="Signups"
                stroke="oklch(0.64 0.17 245)"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="posts"
                name="Posts"
                stroke="oklch(0.67 0.2 320)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="applications"
                name="Applications"
                stroke="oklch(0.75 0.16 85)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            Content Health
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Snapshot of moderation and publishing states across the platform.
          </p>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={CONTENT_HEALTH}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 265)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="oklch(0.64 0.17 245)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            Operational Priorities
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Hardcoded admin tasks to keep the dashboard useful during integration.
          </p>

          <div className="space-y-4">
            {OPERATIONAL_ITEMS.map(({ title, value, detail, icon: Icon }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-border bg-background/70 p-4"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {value}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            Campus Signals
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            A few mock insights to make the admin homepage feel alive for demos.
          </p>

          <div className="space-y-3">
            {CAMPUS_SIGNALS.map((signal) => (
              <div
                key={signal}
                className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground"
              >
                {signal}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
