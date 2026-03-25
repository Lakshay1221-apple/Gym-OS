"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation";
import type { PaginatedResponse, Notification } from "@/types";
import { Dumbbell, Bell, LogOut, Menu, X, ChevronDown } from "lucide-react";

interface DashboardShellProps {
  navItems: NavItem[];
  notificationsHref: string;
  children: React.ReactNode;
}

export function DashboardShell({ navItems, notificationsHref, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => api.get<PaginatedResponse<Notification>>("/api/notifications?unread=true&limit=5"),
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.pagination?.total || 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--card)] transition-transform duration-200 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-[var(--border)] px-6">
          <Dumbbell className="h-6 w-6 text-[var(--primary)]" />
          <span className="text-lg font-bold">GymOS</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.label === "Notifications" && unreadCount > 0 && (
                  <Badge variant="default" className="ml-auto h-5 min-w-[20px] justify-center text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--border)] p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 hover:bg-[var(--accent)] lg:hidden cursor-pointer"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden text-sm text-[var(--muted-foreground)] lg:block">
            {navItems.find((n) => n.href === pathname)?.label || "Dashboard"}
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-lg p-2 hover:bg-[var(--accent)] cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--primary)]" />
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl">
                    <h3 className="mb-3 text-sm font-semibold">Notifications</h3>
                    {notifData?.data && notifData.data.length > 0 ? (
                      <div className="space-y-2">
                        {notifData.data.map((n) => (
                          <div key={n._id} className="rounded-lg bg-[var(--accent)] p-3">
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{n.message}</p>
                          </div>
                        ))}
                        <Link
                          href={notificationsHref}
                          className="block text-center text-xs text-[var(--primary)] hover:underline"
                          onClick={() => setNotifOpen(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--muted-foreground)]">No new notifications</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User info */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-black">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{user?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
