"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/pagination";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Notification, PaginatedResponse } from "@/types";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

export default function MemberNotificationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => api.get<PaginatedResponse<Notification>>(`/api/notifications?page=${page}&limit=20`),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/api/notifications/read-all"),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-[var(--muted-foreground)]">View your gym notifications</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
          {markAllRead.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
          Mark All Read
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {data.data.map((n) => (
                <div
                  key={n._id}
                  className={`flex items-start gap-4 p-4 transition-colors ${!n.read ? "bg-[var(--primary)]/5" : ""}`}
                >
                  <div className={`mt-1 rounded-full p-2 ${!n.read ? "bg-[var(--primary)]/10" : "bg-[var(--accent)]"}`}>
                    <Bell className={`h-4 w-4 ${!n.read ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      {!n.read && <Badge variant="default" className="text-[10px]">New</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{n.message}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markRead.mutate(n._id)}
                      disabled={markRead.isPending}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Bell className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)]">No notifications</p>
            </div>
          )}
          {data?.pagination && (
            <div className="p-4">
              <Pagination page={page} pages={data.pagination.pages} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
