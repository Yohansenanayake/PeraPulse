import { create } from "zustand";

export const useUiStore = create((set) => ({
  sidebarOpen: true,
  notifUnreadCount: 0,
  darkMode: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setNotifUnreadCount: (count) => set({ notifUnreadCount: count }),
  incrementNotifCount: () =>
    set((s) => ({ notifUnreadCount: s.notifUnreadCount + 1 })),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      document.documentElement.classList.toggle("dark", next);
      return { darkMode: next };
    }),
}));
