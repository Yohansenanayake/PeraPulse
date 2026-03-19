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
  const { setNotifUnreadCount } = useUiStore();

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
            className={`flex w-full items-start gap-3 rounded-2xl border px-5 py-4 text-left transition-colors ${n.read ? "border-border bg-card opacity-70" : "border-primary/30 bg-primary/5 hover:bg-primary/8"}`}
          >
            <span className="mt-1 shrink-0">
              {n.read ? (
                <Circle className="size-3 text-muted-foreground" />
              ) : (
                <div className="size-2.5 rounded-full bg-primary mt-0.5" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
              <p className="mt-1 text-[10px] text-muted-foreground">
                {n.createdAt ? format(new Date(n.createdAt), "MMM d, yyyy · h:mm a") : ""}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
