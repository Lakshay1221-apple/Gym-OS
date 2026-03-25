"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Membership, MembershipPlan } from "@/types";
import { CreditCard, CalendarDays, Clock, DollarSign } from "lucide-react";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  grace: "warning",
  expired: "destructive",
  cancelled: "secondary",
  pending: "secondary",
};

export default function MemberMembershipPage() {
  const { user } = useAuth();

  const { data: memberships, isLoading } = useQuery({
    queryKey: ["member-memberships", user?._id],
    queryFn: () => api.get<Membership[]>(`/api/memberships/member/${user!._id}`),
    enabled: !!user?._id,
  });

  const activeMembership = memberships?.find((m) => m.status === "active" || m.status === "grace");
  const pastMemberships = memberships?.filter((m) => m.status !== "active" && m.status !== "grace") || [];

  const getDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Membership</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Your gym membership details</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : memberships && memberships.length > 0 ? (
        <>
          {/* Active membership */}
          {activeMembership && (() => {
            const plan = activeMembership.plan as MembershipPlan;
            const daysRemaining = getDaysRemaining(activeMembership.endDate);
            return (
              <Card className="border-[var(--primary)]/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Current Membership</CardTitle>
                    <Badge variant={statusVariant[activeMembership.status]}>{activeMembership.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold">{plan?.name || "Unknown Plan"}</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg bg-[var(--accent)] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
                        <p className="text-xs text-[var(--muted-foreground)]">Start Date</p>
                      </div>
                      <p className="font-semibold">{formatDate(activeMembership.startDate)}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--accent)] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
                        <p className="text-xs text-[var(--muted-foreground)]">End Date</p>
                      </div>
                      <p className="font-semibold">{formatDate(activeMembership.endDate)}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--accent)] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-[var(--primary)]" />
                        <p className="text-xs text-[var(--muted-foreground)]">Days Remaining</p>
                      </div>
                      <p className="font-semibold">{daysRemaining} days</p>
                    </div>
                    <div className="rounded-lg bg-[var(--accent)] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-[var(--primary)]" />
                        <p className="text-xs text-[var(--muted-foreground)]">Price</p>
                      </div>
                      <p className="font-semibold">{plan?.price != null ? formatCurrency(plan.price) : "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Past memberships */}
          {pastMemberships.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Past Memberships</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastMemberships.map((m) => {
                      const plan = m.plan as MembershipPlan;
                      return (
                        <TableRow key={m._id}>
                          <TableCell className="font-medium">{plan?.name || "Unknown"}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[m.status]}>{m.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(m.startDate)}</TableCell>
                          <TableCell className="text-sm">{formatDate(m.endDate)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="text-[var(--muted-foreground)]">No membership found. Contact your gym admin.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
