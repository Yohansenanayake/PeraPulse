import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Users, Newspaper, Briefcase, CalendarDays } from "lucide-react";
import { analyticsApi } from "@/api/analytics";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { format, subDays } from "date-fns";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center gap-4">
      <div className={`flex size-12 items-center justify-center rounded-2xl ${color}`}>
        <Icon className="size-6" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const to = format(new Date(), "yyyy-MM-dd");
  const from = format(subDays(new Date(), 6), "yyyy-MM-dd");

  const { data: summary, isLoading: sumLoading, isError: sumError, refetch: refetchSum } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => analyticsApi.getSummary(),
  });

  const { data: daily, isLoading: dailyLoading } = useQuery({
    queryKey: ["analytics-daily", from, to],
    queryFn: () => analyticsApi.getDaily(from, to),
  });

  const { data: topPosts, isLoading: topLoading } = useQuery({
    queryKey: ["top-posts"],
    queryFn: () => analyticsApi.getTopPosts(5),
  });

  const dailyData = daily?.content ?? daily ?? [];
  const topData = topPosts?.content ?? topPosts ?? [];

  return (
    <div>
      <PageHeader title="Analytics Dashboard" subtitle="Platform-wide activity overview" />

      {sumLoading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">{Array.from({length:4}).map((_,i)=><CardSkeleton key={i}/>)}</div>}
      {sumError && <ErrorState onRetry={refetchSum} />}

      {!sumLoading && summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard icon={Users} label="Total Users" value={summary.totalUsers} color="bg-primary/10 text-primary" />
          <StatCard icon={Newspaper} label="Total Posts" value={summary.totalPosts} color="bg-indigo-100 text-indigo-600" />
          <StatCard icon={Briefcase} label="Opportunities" value={summary.totalOpportunities} color="bg-amber-100 text-amber-700" />
          <StatCard icon={CalendarDays} label="Events" value={summary.totalEvents} color="bg-emerald-100 text-emerald-700" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily activity chart */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold mb-4">Daily Activity (Last 7 Days)</p>
          {dailyLoading ? (
            <div className="h-52 animate-pulse rounded-xl bg-muted" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 265)" />
                <XAxis dataKey="statDate" tick={{ fontSize: 11 }} tickFormatter={(v) => format(new Date(v), "MMM d")} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="newPosts" stroke="oklch(0.56 0.22 264)" name="Posts" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="newApplications" stroke="oklch(0.78 0.15 85)" name="Applications" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="newRsvps" stroke="oklch(0.72 0.18 145)" name="RSVPs" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top liked posts */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold mb-4">Top Liked Posts</p>
          {topLoading ? (
            <div className="h-52 animate-pulse rounded-xl bg-muted" />
          ) : topData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 265)" />
                <XAxis dataKey="postId" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(0, 6) + "…"} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="likeCount" fill="oklch(0.56 0.22 264)" name="Likes" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
