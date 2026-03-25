"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { WorkoutProgram, TrainerAssignment, Attendance, User } from "@/types";
import { Dumbbell, Users, CalendarCheck } from "lucide-react";

export default function TrainerDashboard() {
  const { user } = useAuth();

  const { data: programs, isLoading: progLoading } = useQuery({
    queryKey: ["trainer", "programs"],
    queryFn: () => api.get<WorkoutProgram[]>("/api/programs"),
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["trainer", "my-clients"],
    queryFn: () => api.get<TrainerAssignment[]>("/api/programs/my-clients"),
  });

  const { data: todayAttendance, isLoading: attLoading } = useQuery({
    queryKey: ["trainer", "attendance-today"],
    queryFn: () => api.get<Attendance[]>("/api/attendance/today"),
  });

  const isLoading = progLoading || clientsLoading || attLoading;

  const myPrograms = programs?.filter(
    (p) => (p.trainer as User)?._id === user?._id || p.trainer === user?._id
  ) || [];

  const activeClients = clients?.filter((c) => c.status === "active") || [];
  const recentClients = activeClients.slice(0, 5);

  const statCards = [
    {
      title: "My Programs",
      value: myPrograms.length,
      icon: Dumbbell,
    },
    {
      title: "Active Clients",
      value: activeClients.length,
      icon: Users,
    },
    {
      title: "Today's Check-ins",
      value: todayAttendance?.length ?? 0,
      icon: CalendarCheck,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trainer Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Overview of your training activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) =>
          isLoading ? (
            <Skeleton key={stat.title} className="h-32 rounded-xl" />
          ) : (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--muted-foreground)]">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
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

      {/* Recent clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Clients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {clientsLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : recentClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentClients.map((assignment) => {
                  const member = assignment.member as User;
                  const program = assignment.program as WorkoutProgram;
                  return (
                    <TableRow key={assignment._id}>
                      <TableCell className="font-medium">{member?.name || "—"}</TableCell>
                      <TableCell className="text-sm">{program?.name || "—"}</TableCell>
                      <TableCell className="text-sm">{formatDate(assignment.startDate)}</TableCell>
                      <TableCell>
                        <Badge variant="success">{assignment.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)]">No active clients yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
