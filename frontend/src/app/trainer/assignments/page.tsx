"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { TrainerAssignment, User, WorkoutProgram } from "@/types";
import { ClipboardList } from "lucide-react";

const statusVariant = {
  active: "success" as const,
  completed: "secondary" as const,
  cancelled: "destructive" as const,
};

export default function TrainerAssignmentsPage() {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["trainer", "my-clients"],
    queryFn: () => api.get<TrainerAssignment[]>("/api/programs/my-clients"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Track all program assignments</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : assignments && assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => {
                  const member = assignment.member as User;
                  const program = assignment.program as WorkoutProgram;
                  return (
                    <TableRow key={assignment._id}>
                      <TableCell className="font-medium">{member?.name || "—"}</TableCell>
                      <TableCell className="text-sm">{program?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[assignment.status] || "secondary"}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(assignment.startDate)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <ClipboardList className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)]">No assignments found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
