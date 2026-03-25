"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { RevenueMetrics, AttendanceMetrics, MembershipMetrics, TrainerMetrics } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["#C8FF00", "#22c55e", "#ef4444", "#6b7280", "#f59e0b"];

export default function AnalyticsPage() {
  const { data: revenue, isLoading: revLoad } = useQuery({
    queryKey: ["metrics", "revenue"],
    queryFn: () => api.get<RevenueMetrics>("/api/admin/metrics/revenue"),
  });
  const { data: attendance, isLoading: attLoad } = useQuery({
    queryKey: ["metrics", "attendance"],
    queryFn: () => api.get<AttendanceMetrics>("/api/admin/metrics/attendance"),
  });
  const { data: memberships, isLoading: memLoad } = useQuery({
    queryKey: ["metrics", "memberships"],
    queryFn: () => api.get<MembershipMetrics>("/api/admin/metrics/memberships"),
  });
  const { data: trainers, isLoading: trnLoad } = useQuery({
    queryKey: ["metrics", "trainers"],
    queryFn: () => api.get<TrainerMetrics>("/api/admin/metrics/trainers"),
  });

  const pieData = memberships
    ? [
        { name: "Active", value: memberships.active },
        { name: "Grace", value: memberships.grace },
        { name: "Expired", value: memberships.expired },
        { name: "Cancelled", value: memberships.cancelled },
        { name: "Pending", value: memberships.pending },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Detailed performance insights for your gym</p>
      </div>

      {/* Revenue summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Today", val: revenue?.today },
          { title: "This Month", val: revenue?.month },
          { title: "Total Revenue", val: revenue?.total },
          { title: "Avg Plan Value", val: revenue?.averagePlanValue },
        ].map((c) => (
          <Card key={c.title}>
            <CardContent className="p-6">
              <p className="text-sm text-[var(--muted-foreground)]">{c.title}</p>
              {revLoad ? (
                <Skeleton className="mt-2 h-8 w-24" />
              ) : (
                <p className="mt-1 text-2xl font-bold">{formatCurrency(c.val || 0)}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Trend (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {revLoad ? (
            <Skeleton className="h-72" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenue?.revenueByDay || []}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8FF00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C8FF00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="_id" tick={{ fill: "#999", fontSize: 11 }} tickFormatter={(v) => v?.slice(5) || ""} />
                <YAxis tick={{ fill: "#999", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, color: "#f0f0f0" }} formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} />
                <Area type="monotone" dataKey="total" stroke="#C8FF00" fill="url(#grad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Peak hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Peak Hours</CardTitle>
          </CardHeader>
          <CardContent>
            {attLoad ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={attendance?.peakHours || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="hour" tick={{ fill: "#999", fontSize: 11 }} tickFormatter={(v) => `${v}:00`} />
                  <YAxis tick={{ fill: "#999", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, color: "#f0f0f0" }} labelFormatter={(v) => `${v}:00`} />
                  <Bar dataKey="visits" fill="#C8FF00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Membership pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Membership Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {memLoad ? (
              <Skeleton className="h-64" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, color: "#f0f0f0" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-[var(--muted-foreground)]">No membership data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top trainers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Trainers</CardTitle>
        </CardHeader>
        <CardContent>
          {trnLoad ? (
            <Skeleton className="h-32" />
          ) : trainers?.topTrainers && trainers.topTrainers.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trainers.topTrainers.map((t, i) => (
                <div key={t._id} className="flex items-center gap-3 rounded-lg bg-[var(--accent)] p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-black">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-medium">{t.trainer.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{t.activeClients} active clients</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-[var(--muted-foreground)]">No trainer data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
