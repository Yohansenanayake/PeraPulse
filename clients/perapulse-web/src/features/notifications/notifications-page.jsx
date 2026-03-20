import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bell, CheckCheck, Circle } from "lucide-react";
import { notificationsApi } from "@/api/notifications";
import { useUiStore } from "@/store/ui-store";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { setNotifUnreadCount, darkMode } = useUiStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications(0, 50),
  });

  const notifications = data?.content ?? data ?? [];

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setNotifUnreadCount(0);
    },
  });

  const markOne = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const actions = unreadCount > 0 && (
    <Button size="sm" variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending} className="gap-1.5">
      <CheckCheck className="size-3.5" /> Mark all read
    </Button>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
        actions={actions}
      />

      {isLoading && <LoadingSkeleton count={4} />}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && notifications.length === 0 && (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.read && markOne.mutate(n.id)}
            className={`flex w-full items-start gap-3 rounded-2xl border px-5 py-4 text-left transition-colors ${n.read ? darkMode ? 'border-cyan-500/10 bg-slate-900/30 opacity-70' : 'border-blue-200 bg-blue-50 opacity-70' : darkMode ? 'border-cyan-500/30 bg-cyan-600/10 hover:bg-cyan-600/15' : 'border-blue-300 bg-blue-100 hover:bg-blue-150'}`}
          >
            <span className="mt-1 shrink-0">
              {n.read ? (
                <Circle className={`size-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
              ) : (
                <div className={`size-2.5 rounded-full mt-0.5 ${darkMode ? 'bg-cyan-400' : 'bg-blue-600'}`} />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${n.read ? darkMode ? 'text-slate-400' : 'text-slate-600' : darkMode ? 'text-white' : 'text-slate-900'}`}>{n.title}</p>
              {n.body && <p className={`mt-0.5 text-xs line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{n.body}</p>}
              <p className={`mt-1 text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {n.createdAt ? format(new Date(n.createdAt), "MMM d, yyyy · h:mm a") : ""}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
