"use client";

import { DashboardShell } from "@/components/shared/dashboard-shell";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { memberNavItems } from "@/lib/navigation";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["member"]}>
      <DashboardShell navItems={memberNavItems} notificationsHref="/member/notifications">
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
