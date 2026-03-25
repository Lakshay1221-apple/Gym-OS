"use client";

import { DashboardShell } from "@/components/shared/dashboard-shell";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { trainerNavItems } from "@/lib/navigation";

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["trainer"]}>
      <DashboardShell navItems={trainerNavItems} notificationsHref="/trainer/dashboard">
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
