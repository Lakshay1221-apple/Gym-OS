"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Attendance, PaginatedResponse } from "@/types";
import { LogIn, LogOut, Loader2, CalendarCheck } from "lucide-react";

export default function MemberAttendancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ["member-attendance", user?._id, page],
    queryFn: () => api.get<PaginatedResponse<Attendance>>(`/api/attendance/member/${user!._id}?page=${page}&limit=20`),
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

  const checkOut = useMutation({
    mutationFn: () => api.post("/api/attendance/checkout"),
    onSuccess: () => {
      toast.success("Checked out successfully");
      qc.invalidateQueries({ queryKey: ["member-attendance"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const latestEntry = attendanceData?.data?.[0];
  const isCheckedIn = latestEntry && !latestEntry.checkOutTime;

  const calculateDuration = (checkIn: string, checkOut?: string): string => {
    if (!checkOut) return "—";
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hours > 0) return `${hours}h ${remainMins}m`;
    return `${remainMins}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Track your gym visits</p>
      </div>

      {/* Check in/out actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCheckedIn ? (
            <div className="rounded-lg bg-green-500/10 p-3">
              <p className="text-sm text-green-400">
                You are checked in since {formatDateTime(latestEntry.checkInTime)}
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-[var(--accent)] p-3">
              <p className="text-sm text-[var(--muted-foreground)]">Not currently checked in</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2"
              onClick={() => checkIn.mutate()}
              disabled={checkIn.isPending || !!isCheckedIn}
            >
              {checkIn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Check In
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => checkOut.mutate()}
              disabled={checkOut.isPending || !isCheckedIn}
            >
              {checkOut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Check Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Attendance History</CardTitle>
            {attendanceData?.pagination && (
              <Badge variant="secondary">{attendanceData.pagination.total} total</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead>Check-out Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData?.data?.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell className="text-sm">{formatDateTime(a.checkInTime)}</TableCell>
                      <TableCell className="text-sm">{a.checkOutTime ? formatDateTime(a.checkOutTime) : "—"}</TableCell>
                      <TableCell className="text-sm">{calculateDuration(a.checkInTime, a.checkOutTime)}</TableCell>
                      <TableCell className="text-sm capitalize">{a.method}</TableCell>
                    </TableRow>
                  ))}
                  {(!attendanceData?.data || attendanceData.data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-[var(--muted-foreground)]">
                        <CalendarCheck className="mx-auto mb-2 h-8 w-8" />
                        No attendance records yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {attendanceData?.pagination && (
                <div className="p-4">
                  <Pagination page={page} pages={attendanceData.pagination.pages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
