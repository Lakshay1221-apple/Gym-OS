"use client";

import { DashboardShell } from "@/components/shared/dashboard-shell";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { adminNavItems } from "@/lib/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardShell navItems={adminNavItems} notificationsHref="/admin/notifications">
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
