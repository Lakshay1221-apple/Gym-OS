"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TrainerAssignment, WorkoutProgram, User, Exercise } from "@/types";
import { Dumbbell } from "lucide-react";
import Link from "next/link";

export default function MemberWorkoutsPage() {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["member-assignments"],
    queryFn: () => api.get<TrainerAssignment[]>("/api/programs/my-assignments"),
  });

  const activeAssignments = assignments?.filter((a) => a.status === "active") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Workouts</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Your assigned workout programs</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : activeAssignments.length > 0 ? (
        <div className="space-y-6">
          {activeAssignments.map((assignment) => {
            const program = assignment.program as WorkoutProgram;
            const trainer = assignment.trainer as User;
            return (
              <Card key={assignment._id} className="transition-all hover:border-[var(--primary)]/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{program?.name || "Unnamed Program"}</CardTitle>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Trainer: {trainer?.name || "Unknown"}
                      </p>
                    </div>
                    <Link href="/member/workout-session">
                      <Button className="gap-2">
                        <Dumbbell className="h-4 w-4" /> Start This Workout
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {program?.workouts && program.workouts.length > 0 ? (
                    <div className="space-y-6">
                      {program.workouts.map((day, dayIdx) => (
                        <div key={dayIdx}>
                          <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{day.dayName}</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Exercise</TableHead>
                                <TableHead>Sets x Reps</TableHead>
                                <TableHead>Rest</TableHead>
                                <TableHead>Muscle Group</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {day.exercises.map((ex, exIdx) => {
                                const exercise = ex.exerciseId as Exercise;
                                return (
                                  <TableRow key={exIdx}>
                                    <TableCell className="font-medium">{exercise?.exerciseName || "—"}</TableCell>
                                    <TableCell>{ex.targetSets} x {ex.targetReps}</TableCell>
                                    <TableCell>{ex.restTime ? `${ex.restTime}s` : "—"}</TableCell>
                                    <TableCell className="capitalize">{exercise?.muscleGroup || "—"}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted-foreground)]">No workout days configured for this program yet.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Dumbbell className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="text-[var(--muted-foreground)]">No workout programs assigned yet. Ask your trainer to assign one!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
