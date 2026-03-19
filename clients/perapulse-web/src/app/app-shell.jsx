import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Menu } from "lucide-react";

import { useAuthState } from "@/auth/use-auth-state";
import { useUiStore } from "@/store/ui-store";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/shared/auth-guard";

// Feature pages — lazy-ish inline imports for code clarity
import { LandingPage } from "@/features/home/landing-page";
import { FeedPage } from "@/features/feed/feed-page";
import { OpportunitiesPage } from "@/features/opportunities/opportunities-page";
import { OpportunityDetailPage } from "@/features/opportunities/opportunity-detail-page";
import { CreateOpportunityPage } from "@/features/opportunities/create-opportunity-page";
import { ApplicationsManagementPage } from "@/features/opportunities/applications-management-page";
import { MyApplicationsPage } from "@/features/opportunities/my-applications-page";
import { EventsPage } from "@/features/events/events-page";
import { EventDetailPage } from "@/features/events/event-detail-page";
import { CreateEventPage } from "@/features/events/create-event-page";
import { MyRsvpsPage } from "@/features/events/my-rsvps-page";
import { NotificationsPage } from "@/features/notifications/notifications-page";
import { ProfilePage } from "@/features/profile/profile-page";
import { EditProfilePage } from "@/features/profile/edit-profile-page";
import { RoleRequestPage } from "@/features/profile/role-request-page";
import { AdminDashboardPage } from "@/features/admin/admin-dashboard-page";
import { UserManagementPage } from "@/features/admin/user-management-page";
import { AdminRoleRequestsPage } from "@/features/admin/admin-role-requests-page";

export function AppShell() {
  const { auth, ready } = useAuthState();
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  // Default sidebar open on desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setSidebarOpen(mq.matches);
    const handler = (e) => setSidebarOpen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setSidebarOpen]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Unauthenticated: only show landing
  if (!auth.isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  // Authenticated: full app layout
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold">PeraPulse</span>
        </header>

        {/* Page router */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />

            <Route path="/feed" element={<AuthGuard><FeedPage /></AuthGuard>} />

            <Route path="/opportunities" element={<AuthGuard><OpportunitiesPage /></AuthGuard>} />
            <Route path="/opportunities/create" element={<AuthGuard roles={["ALUMNI","ADMIN"]}><CreateOpportunityPage /></AuthGuard>} />
            <Route path="/opportunities/:id" element={<AuthGuard><OpportunityDetailPage /></AuthGuard>} />
            <Route path="/opportunities/:id/applications" element={<AuthGuard roles={["ALUMNI","ADMIN"]}><ApplicationsManagementPage /></AuthGuard>} />
            <Route path="/applications/me" element={<AuthGuard><MyApplicationsPage /></AuthGuard>} />

            <Route path="/events" element={<AuthGuard><EventsPage /></AuthGuard>} />
            <Route path="/events/create" element={<AuthGuard roles={["ALUMNI","ADMIN"]}><CreateEventPage /></AuthGuard>} />
            <Route path="/events/me/rsvps" element={<AuthGuard><MyRsvpsPage /></AuthGuard>} />
            <Route path="/events/:id" element={<AuthGuard><EventDetailPage /></AuthGuard>} />

            <Route path="/notifications" element={<AuthGuard><NotificationsPage /></AuthGuard>} />

            <Route path="/profile/me" element={<AuthGuard><EditProfilePage /></AuthGuard>} />
            <Route path="/profile/role-request" element={<AuthGuard roles={["STUDENT"]}><RoleRequestPage /></AuthGuard>} />
            <Route path="/profile/:sub" element={<AuthGuard><ProfilePage /></AuthGuard>} />

            <Route path="/admin" element={<AuthGuard roles={["ADMIN"]}><AdminDashboardPage /></AuthGuard>} />
            <Route path="/admin/users" element={<AuthGuard roles={["ADMIN"]}><UserManagementPage /></AuthGuard>} />
            <Route path="/admin/role-requests" element={<AuthGuard roles={["ADMIN"]}><AdminRoleRequestsPage /></AuthGuard>} />

            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
