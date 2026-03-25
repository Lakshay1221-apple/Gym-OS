"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Attendance, User } from "@/types";
import { LogIn, LogOut, Loader2, CalendarCheck } from "lucide-react";

export default function AttendancePage() {
  const qc = useQueryClient();
  const [memberId, setMemberId] = useState("");

  const { data: todayList, isLoading } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => api.get<Attendance[]>("/api/attendance/today"),
    refetchInterval: 15000,
  });

  const checkIn = useMutation({
    mutationFn: (mId: string) => api.post("/api/attendance/checkin", { memberId: mId }),
    onSuccess: () => {
      toast.success("Checked in");
      setMemberId("");
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const checkOut = useMutation({
    mutationFn: (mId: string) => api.post("/api/attendance/checkout", { memberId: mId }),
    onSuccess: () => {
      toast.success("Checked out");
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Track member check-ins and check-outs</p>
      </div>

      {/* Quick check-in */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="sr-only">Member ID</Label>
              <Input
                placeholder="Enter Member ID"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              />
            </div>
            <Button
              className="gap-2"
              onClick={() => memberId && checkIn.mutate(memberId)}
              disabled={checkIn.isPending || !memberId}
            >
              {checkIn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Check In
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's attendance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Today&apos;s Attendance</CardTitle>
            <Badge variant="secondary">{todayList?.length || 0} entries</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayList?.map((a) => {
                  const member = a.member as User;
                  const isActive = !a.checkOutTime;
                  return (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium">{member?.name || "—"}</TableCell>
                      <TableCell className="text-sm">{formatDateTime(a.checkInTime)}</TableCell>
                      <TableCell className="text-sm">{a.checkOutTime ? formatDateTime(a.checkOutTime) : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "success" : "secondary"}>
                          {isActive ? "Active" : "Completed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              const mId = typeof a.member === "string" ? a.member : a.member._id;
                              checkOut.mutate(mId);
                            }}
                            disabled={checkOut.isPending}
                          >
                            <LogOut className="h-3 w-3" /> Check Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!todayList || todayList.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-[var(--muted-foreground)]">
                      <CalendarCheck className="mx-auto mb-2 h-8 w-8" />
                      No check-ins today
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
