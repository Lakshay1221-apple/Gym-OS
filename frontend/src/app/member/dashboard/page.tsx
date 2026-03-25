"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Membership, MembershipPlan, TrainerAssignment, WorkoutProgram, Attendance, PaginatedResponse } from "@/types";
import { CreditCard, Dumbbell, CalendarCheck, Zap, LogIn, Loader2 } from "lucide-react";
import Link from "next/link";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  grace: "warning",
  expired: "destructive",
  cancelled: "secondary",
  pending: "secondary",
};

export default function MemberDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: memberships, isLoading: memLoading } = useQuery({
    queryKey: ["member-memberships", user?._id],
    queryFn: () => api.get<Membership[]>(`/api/memberships/member/${user!._id}`),
    enabled: !!user?._id,
  });

  const { data: assignments, isLoading: assignLoading } = useQuery({
    queryKey: ["member-assignments"],
    queryFn: () => api.get<TrainerAssignment[]>("/api/programs/my-assignments"),
    enabled: !!user?._id,
  });

  const { data: attendanceData, isLoading: attLoading } = useQuery({
    queryKey: ["member-attendance", user?._id],
    queryFn: () => api.get<PaginatedResponse<Attendance>>(`/api/attendance/member/${user!._id}?page=1&limit=5`),
    enabled: !!user?._id,
  });

  const checkIn = useMutation({
    mutationFn: () => api.post("/api/attendance/checkin"),
    onSuccess: () => {
      toast.success("Checked in successfully");
      qc.invalidateQueries({ queryKey: ["member-attendance"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isLoading = memLoading || assignLoading || attLoading;

  const activeMembership = memberships?.find((m) => m.status === "active" || m.status === "grace");
  const activePlan = activeMembership?.plan as MembershipPlan | undefined;
  const activeAssignment = assignments?.find((a) => a.status === "active");
  const activeProgram = activeAssignment?.program as WorkoutProgram | undefined;

  const statCards = [
    {
      title: "Membership",
      value: activePlan?.name || "No active plan",
      sub: activeMembership ? (
        <Badge variant={statusVariant[activeMembership.status]}>{activeMembership.status}</Badge>
      ) : null,
      icon: CreditCard,
    },
    {
      title: "Current Program",
      value: activeProgram?.name || "No program assigned",
      sub: null,
      icon: Dumbbell,
    },
    {
      title: "Attendance",
      value: attendanceData?.pagination?.total ?? 0,
      sub: "total check-ins",
      icon: CalendarCheck,
    },
    {
      title: "Quick Actions",
      value: null,
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Welcome back, {user?.name}</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) =>
          isLoading ? (
            <Skeleton key={stat.title} className="h-32 rounded-xl" />
          ) : stat.title === "Quick Actions" ? (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-[var(--muted-foreground)]">{stat.title}</p>
                  <div className="rounded-xl bg-[var(--primary)]/10 p-3">
                    <stat.icon className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href="/member/workout-session">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Dumbbell className="h-4 w-4" /> Start Workout
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => checkIn.mutate()}
                    disabled={checkIn.isPending}
                  >
                    {checkIn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    Check In
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--muted-foreground)]">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                    {stat.sub && (
                      <div className="mt-1 text-xs text-[var(--muted-foreground)]">{stat.sub}</div>
                    )}
                  </div>
                  <div className="rounded-xl bg-[var(--primary)]/10 p-3">
                    <stat.icon className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {attLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData?.data?.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell className="text-sm">{formatDateTime(a.checkInTime)}</TableCell>
                    <TableCell className="text-sm">
                      {a.checkOutTime ? formatDateTime(a.checkOutTime) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{a.method}</TableCell>
                  </TableRow>
                ))}
                {(!attendanceData?.data || attendanceData.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-[var(--muted-foreground)]">
                      <CalendarCheck className="mx-auto mb-2 h-8 w-8" />
                      No attendance records yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
