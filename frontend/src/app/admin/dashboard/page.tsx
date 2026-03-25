"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { RevenueMetrics, AttendanceMetrics, MembershipMetrics, TrainerMetrics } from "@/types";
import { DollarSign, Users, CalendarCheck, UserCheck } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function DashboardOverview() {
  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ["metrics", "revenue"],
    queryFn: () => api.get<RevenueMetrics>("/api/admin/metrics/revenue"),
  });

  const { data: attendance, isLoading: attLoading } = useQuery({
    queryKey: ["metrics", "attendance"],
    queryFn: () => api.get<AttendanceMetrics>("/api/admin/metrics/attendance"),
  });

  const { data: memberships, isLoading: memLoading } = useQuery({
    queryKey: ["metrics", "memberships"],
    queryFn: () => api.get<MembershipMetrics>("/api/admin/metrics/memberships"),
  });

  const { data: trainers, isLoading: trnLoading } = useQuery({
    queryKey: ["metrics", "trainers"],
    queryFn: () => api.get<TrainerMetrics>("/api/admin/metrics/trainers"),
  });

  const isLoading = revLoading || attLoading || memLoading || trnLoading;

  const statCards = [
    {
      title: "Total Revenue",
      value: revenue ? formatCurrency(revenue.total) : "—",
      sub: revenue ? `Today: ${formatCurrency(revenue.today)}` : "",
      icon: DollarSign,
    },
    {
      title: "Active Members",
      value: memberships?.active ?? "—",
      sub: memberships ? `Grace: ${memberships.grace} · Expired: ${memberships.expired}` : "",
      icon: Users,
    },
    {
      title: "Today's Check-ins",
      value: attendance?.todayTotal ?? "—",
      sub: attendance ? `Active now: ${attendance.activeNow}` : "",
      icon: CalendarCheck,
    },
    {
      title: "Active Trainers",
      value: trainers?.byStatus?.active ?? "—",
      sub: trainers ? `Top trainers: ${trainers.topTrainers?.length || 0}` : "",
      icon: UserCheck,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Overview of your gym performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{stat.sub}</p>
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

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {revLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenue?.revenueByDay || []}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8FF00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C8FF00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    dataKey="_id"
                    tick={{ fill: "#999", fontSize: 11 }}
                    tickFormatter={(v) => v?.slice(5) || ""}
                  />
                  <YAxis tick={{ fill: "#999", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, color: "#f0f0f0" }}
                    labelFormatter={(v) => `Date: ${v}`}
                    formatter={(v) => [formatCurrency(Number(v)), "Revenue"]}
                  />
                  <Area type="monotone" dataKey="total" stroke="#C8FF00" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Peak hours chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Peak Hours (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {attLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={attendance?.peakHours || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#999", fontSize: 11 }}
                    tickFormatter={(v) => `${v}:00`}
                  />
                  <YAxis tick={{ fill: "#999", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, color: "#f0f0f0" }}
                    labelFormatter={(v) => `${v}:00`}
                    formatter={(v) => [v, "Visits"]}
                  />
                  <Bar dataKey="visits" fill="#C8FF00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Membership breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membership Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {memLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {(["active", "grace", "expired", "cancelled", "pending"] as const).map((status) => (
                <div key={status} className="rounded-lg bg-[var(--accent)] p-4 text-center">
                  <p className="text-2xl font-bold">{memberships?.[status] ?? 0}</p>
                  <p className="text-xs capitalize text-[var(--muted-foreground)]">{status}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
