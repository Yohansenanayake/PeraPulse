import { Routes, Route, Navigate } from "react-router-dom";
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
import { PeoplePage } from "@/features/people/people-page";
import { ProfilePage } from "@/features/profile/profile-page";
import { EditProfilePage } from "@/features/profile/edit-profile-page";
import { RoleRequestPage } from "@/features/profile/role-request-page";
import { AdminDashboardPage } from "@/features/admin/admin-dashboard-page";
import { UserManagementPage } from "@/features/admin/user-management-page";
import { AdminRoleRequestsPage } from "@/features/admin/admin-role-requests-page";
import { AdminUserDetailPage } from "@/features/admin/admin-user-detail-page";

export function AppShell() {
  const { auth, ready } = useAuthState();
  const { sidebarOpen, setSidebarOpen, darkMode } = useUiStore();

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
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950' : 'bg-gradient-to-b from-blue-50 via-white to-slate-50'}`}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
      
      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {darkMode ? (
          <>
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float"></div>
            <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-cyan-600 rounded-full mix-blend-screen filter blur-3xl opacity-15 animate-float" style={{ animationDelay: "2s" }}></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-float" style={{ animationDelay: "4s" }}></div>
          </>
        ) : (
          <>
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float"></div>
            <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: "2s" }}></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: "4s" }}></div>
          </>
        )}
      </div>
      
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        {/* Mobile top bar */}
        <header className={`flex items-center gap-3 border-b px-4 py-3 backdrop-blur md:hidden shadow-lg ${darkMode ? 'border-cyan-500/20 bg-gradient-to-r from-slate-950/80 to-blue-950/80' : 'border-blue-200 bg-gradient-to-r from-white/80 to-blue-50/80'}`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={`rounded-xl border p-2 shadow-md ${darkMode ? 'border-cyan-500/30 bg-slate-800 text-cyan-400 hover:bg-slate-700' : 'border-blue-300 bg-white text-blue-600 hover:bg-blue-50'}`}
          >
            <Menu className="size-5" />
          </button>
          <div>
            <p className={`text-sm font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>PeraPulse</p>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Department community hub</p>
          </div>
        </header>

        {/* Page router */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 relative">
          <div className="mx-auto w-full max-w-7xl relative z-10">
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

              <Route path="/people" element={<AuthGuard><PeoplePage /></AuthGuard>} />
              <Route path="/notifications" element={<AuthGuard><NotificationsPage /></AuthGuard>} />

              <Route path="/profile/me" element={<AuthGuard><EditProfilePage /></AuthGuard>} />
              <Route path="/profile/role-request" element={<AuthGuard roles={["STUDENT"]}><RoleRequestPage /></AuthGuard>} />
              <Route path="/profile/:sub" element={<AuthGuard><ProfilePage /></AuthGuard>} />

              <Route path="/admin" element={<AuthGuard roles={["ADMIN"]}><AdminDashboardPage /></AuthGuard>} />
              <Route path="/admin/users" element={<AuthGuard roles={["ADMIN"]}><UserManagementPage /></AuthGuard>} />
              <Route path="/admin/users/:sub" element={<AuthGuard roles={["ADMIN"]}><AdminUserDetailPage /></AuthGuard>} />
              <Route path="/admin/role-requests" element={<AuthGuard roles={["ADMIN"]}><AdminRoleRequestsPage /></AuthGuard>} />

              <Route path="*" element={<Navigate to="/feed" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
