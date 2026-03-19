import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Newspaper,
  Briefcase,
  CalendarDays,
  Bell,
  User,
  Users,
  ShieldCheck,
  LogOut,
  Sparkles,
  X,
  Moon,
  Sun,
  ChevronRight,
} from "lucide-react";
import { useAuthState } from "@/auth/use-auth-state";
import { useUiStore } from "@/store/ui-store";

const NAV_ITEMS = [
  { to: "/feed", icon: Newspaper, label: "Feed" },
  { to: "/opportunities", icon: Briefcase, label: "Opportunities" },
  { to: "/events", icon: CalendarDays, label: "Events" },
  { to: "/people", icon: Users, label: "People" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/profile/me", icon: User, label: "My Profile" },
];

const ADMIN_ITEMS = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/role-requests", icon: ShieldCheck, label: "Role Requests" },
];

export function Sidebar() {
  const { userLabel, isAdmin, isAlumni, isStudent, logout } = useAuthState();
  const { sidebarOpen, setSidebarOpen, notifUnreadCount, darkMode, toggleDarkMode } =
    useUiStore();
  const navigate = useNavigate();

  if (!sidebarOpen) return null;

  const roleBadge = isAdmin
    ? { label: "Admin", color: "bg-red-500/15 text-red-600" }
    : isAlumni
    ? { label: "Alumni", color: "bg-amber-500/15 text-amber-700" }
    : { label: "Student", color: "bg-primary/15 text-primary" };

  return (
    <>
      {/* Overlay on mobile */}
      <div
        className="fixed inset-0 z-20 bg-black/40 md:hidden"
        onClick={() => setSidebarOpen(false)}
      />
      {/* Sidebar panel */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-2xl md:relative md:z-auto md:shadow-none">
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <span className="text-base font-bold tracking-tight">
              PeraPulse
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <SidebarLink
                key={to}
                to={to}
                icon={Icon}
                label={label}
                badge={label === "Notifications" && notifUnreadCount > 0 ? notifUnreadCount : null}
              />
            ))}
          </div>

          {/* Alumni quick-links */}
          {(isAlumni || isAdmin) && (
            <div className="mt-5">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                Create
              </p>
              <div className="space-y-0.5">
                <SidebarLink to="/opportunities/create" icon={Briefcase} label="Post Opportunity" />
                <SidebarLink to="/events/create" icon={CalendarDays} label="Create Event" />
              </div>
            </div>
          )}

          {/* Student quick-links */}
          {isStudent && (
            <div className="mt-5">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                My
              </p>
              <div className="space-y-0.5">
                <SidebarLink to="/applications/me" icon={Briefcase} label="My Applications" />
                <SidebarLink to="/events/me/rsvps" icon={CalendarDays} label="My RSVPs" />
                <SidebarLink to="/profile/role-request" icon={ChevronRight} label="Request Alumni" />
              </div>
            </div>
          )}

          {/* Admin */}
          {isAdmin && (
            <div className="mt-5">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                Admin
              </p>
              <div className="space-y-0.5">
                {ADMIN_ITEMS.map(({ to, icon: Icon, label }) => (
                  <SidebarLink key={to} to={to} icon={Icon} label={label} />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
          <button
            onClick={toggleDarkMode}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
          <div className="flex items-center justify-between rounded-xl px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{userLabel}</p>
              <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="ml-2 rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-destructive transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ to, icon: Icon, label, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        }`
      }
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge != null && (
        <span className="flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </NavLink>
  );
}
