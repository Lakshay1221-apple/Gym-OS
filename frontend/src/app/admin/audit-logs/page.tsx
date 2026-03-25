"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog, PaginatedResponse, User } from "@/types";
import { ClipboardList } from "lucide-react";

const actionColors: Record<string, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  "payment.created": "success",
  "payment.refunded": "destructive",
  "membership.created": "success",
  "membership.cancelled": "warning",
  "plan.created": "default",
  "plan.updated": "secondary",
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: () => api.get<PaginatedResponse<AuditLog>>(`/api/audit-logs?page=${page}&limit=20`),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Complete activity log for your gym</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((log) => {
                    const actor = log.actor as User;
                    return (
                      <TableRow key={log._id}>
                        <TableCell>
                          <Badge variant={actionColors[log.action] || "secondary"}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{actor?.name || log.actor?.toString()?.slice(-6) || "—"}</TableCell>
                        <TableCell className="text-sm">{log.entityType}</TableCell>
                        <TableCell className="font-mono text-xs text-[var(--muted-foreground)]">
                          {log.entityId?.toString()?.slice(-8) || "—"}
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(log.createdAt)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {data.pagination && (
                <div className="p-4">
                  <Pagination page={page} pages={data.pagination.pages} onPageChange={setPage} />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <ClipboardList className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)]">No audit logs yet. Actions will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
