"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import type { TrainerAssignment, WorkoutProgram, WorkoutSession, WorkoutSet, Exercise } from "@/types";
import { Play, Square, Plus, Loader2, Timer, Trophy, Dumbbell } from "lucide-react";

type Phase = "idle" | "active" | "finished";

interface LoggedSet {
  exerciseName: string;
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number;
}

export default function WorkoutSessionPage() {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [elapsed, setElapsed] = useState(0);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [setForm, setSetForm] = useState({
    exerciseId: "",
    reps: "",
    weight: "",
    rpe: "",
  });

  const { data: assignments, isLoading: assignLoading } = useQuery({
    queryKey: ["member-assignments"],
    queryFn: () => api.get<TrainerAssignment[]>("/api/programs/my-assignments"),
  });

  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => api.get<Exercise[]>("/api/workout/exercises"),
    enabled: phase === "active" && !selectedAssignment,
  });

  const activeAssignments = assignments?.filter((a) => a.status === "active") || [];

  // Timer
  useEffect(() => {
    if (phase !== "active" || !session) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, session]);

  const formatElapsed = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const startWorkout = useMutation({
    mutationFn: (body: { assignmentId?: string }) => api.post<WorkoutSession>("/api/workout/start", body),
    onSuccess: (data) => {
      setSession(data);
      setPhase("active");
      setLoggedSets([]);
      toast.success("Workout started!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addSet = useMutation({
    mutationFn: (body: { sessionId: string; exerciseId: string; setNumber: number; reps: number; weight: number; rpe?: number }) =>
      api.post<WorkoutSet>("/api/workout/add-set", body),
    onSuccess: (_, variables) => {
      const exerciseName = getExerciseName(variables.exerciseId);
      setLoggedSets((prev) => [
        ...prev,
        {
          exerciseName,
          setNumber: variables.setNumber,
          reps: variables.reps,
          weight: variables.weight,
          rpe: variables.rpe,
        },
      ]);
      setSetForm({ ...setForm, reps: "", weight: "", rpe: "" });
      toast.success("Set logged");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const finishWorkout = useMutation({
    mutationFn: (body: { sessionId: string }) => api.post<WorkoutSession>("/api/workout/finish", body),
    onSuccess: (data) => {
      setSession(data);
      setPhase("finished");
      qc.invalidateQueries({ queryKey: ["member-attendance"] });
      toast.success("Workout finished!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Get program exercises for current assignment
  const getAssignmentProgram = (): WorkoutProgram | null => {
    if (!selectedAssignment) return null;
    const assignment = activeAssignments.find((a) => a._id === selectedAssignment);
    return assignment?.program as WorkoutProgram | null;
  };

  const getProgramExercises = (): Exercise[] => {
    const program = getAssignmentProgram();
    if (!program?.workouts) return [];
    const exs: Exercise[] = [];
    const seen = new Set<string>();
    for (const day of program.workouts) {
      for (const ex of day.exercises) {
        const exercise = ex.exerciseId as Exercise;
        if (exercise?._id && !seen.has(exercise._id)) {
          seen.add(exercise._id);
          exs.push(exercise);
        }
      }
    }
    return exs;
  };

  const getAvailableExercises = (): Exercise[] => {
    if (selectedAssignment) return getProgramExercises();
    return exercises || [];
  };

  const getExerciseName = (exerciseId: string): string => {
    const available = getAvailableExercises();
    return available.find((e) => e._id === exerciseId)?.exerciseName || "Unknown";
  };

  const getNextSetNumber = (exerciseId: string): number => {
    const count = loggedSets.filter((s) => {
      const available = getAvailableExercises();
      const ex = available.find((e) => e._id === exerciseId);
      return ex && s.exerciseName === ex.exerciseName;
    }).length;
    return count + 1;
  };

  const handleReset = () => {
    setPhase("idle");
    setSession(null);
    setSelectedAssignment("");
    setLoggedSets([]);
    setElapsed(0);
    setSetForm({ exerciseId: "", reps: "", weight: "", rpe: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workout Session</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {phase === "idle" && "Start a new workout session"}
          {phase === "active" && "Workout in progress"}
          {phase === "finished" && "Workout complete"}
        </p>
      </div>

      {/* Phase 1: Idle */}
      {phase === "idle" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start a Workout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Program</Label>
                  <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Freestyle (no program)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freestyle">Freestyle (no program)</SelectItem>
                      {activeAssignments.map((a) => {
                        const program = a.program as WorkoutProgram;
                        return (
                          <SelectItem key={a._id} value={a._id}>
                            {program?.name || "Unnamed Program"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    const body = selectedAssignment && selectedAssignment !== "freestyle"
                      ? { assignmentId: selectedAssignment }
                      : {};
                    startWorkout.mutate(body);
                  }}
                  disabled={startWorkout.isPending}
                >
                  {startWorkout.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Start Workout
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phase 2: Active */}
      {phase === "active" && session && (
        <>
          {/* Timer */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[var(--primary)]/10 p-3">
                    <Timer className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted-foreground)]">Elapsed Time</p>
                    <p className="text-3xl font-bold font-mono">{formatElapsed(elapsed)}</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => finishWorkout.mutate({ sessionId: session._id })}
                  disabled={finishWorkout.isPending}
                >
                  {finishWorkout.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Finish Workout
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Program exercises reference */}
          {selectedAssignment && selectedAssignment !== "freestyle" && getAssignmentProgram()?.workouts && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Program Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getAssignmentProgram()!.workouts!.map((day, i) => (
                    <div key={i}>
                      <p className="text-sm font-semibold mb-1">{day.dayName}</p>
                      <div className="flex flex-wrap gap-2">
                        {day.exercises.map((ex, j) => {
                          const exercise = ex.exerciseId as Exercise;
                          return (
                            <Badge key={j} variant="secondary">
                              {exercise?.exerciseName || "—"} ({ex.targetSets}x{ex.targetReps})
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add set form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Set</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!setForm.exerciseId || !setForm.reps || !setForm.weight) return;
                  addSet.mutate({
                    sessionId: session._id,
                    exerciseId: setForm.exerciseId,
                    setNumber: getNextSetNumber(setForm.exerciseId),
                    reps: parseInt(setForm.reps),
                    weight: parseFloat(setForm.weight),
                    rpe: setForm.rpe ? parseInt(setForm.rpe) : undefined,
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Exercise</Label>
                  <Select value={setForm.exerciseId} onValueChange={(v) => setSetForm({ ...setForm, exerciseId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableExercises().map((ex) => (
                        <SelectItem key={ex._id} value={ex._id}>
                          {ex.exerciseName} ({ex.muscleGroup})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Reps</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="10"
                      value={setForm.reps}
                      onChange={(e) => setSetForm({ ...setForm, reps: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      placeholder="60"
                      value={setForm.weight}
                      onChange={(e) => setSetForm({ ...setForm, weight: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RPE (1-10)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      placeholder="7"
                      value={setForm.rpe}
                      onChange={(e) => setSetForm({ ...setForm, rpe: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={addSet.isPending || !setForm.exerciseId}>
                  {addSet.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Log Set
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Logged sets */}
          {loggedSets.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Logged Sets</CardTitle>
                  <Badge variant="secondary">{loggedSets.length} sets</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exercise</TableHead>
                      <TableHead>Set #</TableHead>
                      <TableHead>Reps</TableHead>
                      <TableHead>Weight (kg)</TableHead>
                      <TableHead>RPE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loggedSets.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{s.exerciseName}</TableCell>
                        <TableCell>{s.setNumber}</TableCell>
                        <TableCell>{s.reps}</TableCell>
                        <TableCell>{s.weight}</TableCell>
                        <TableCell>{s.rpe ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Phase 3: Finished */}
      {phase === "finished" && session && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-[var(--primary)]/10 p-4 mb-4">
              <Trophy className="h-12 w-12 text-[var(--primary)]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Workout Complete!</h2>
            {session.duration != null && (
              <p className="text-[var(--muted-foreground)] mb-1">
                Duration: {Math.floor(session.duration / 60)} min {session.duration % 60} sec
              </p>
            )}
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              {loggedSets.length} sets logged
            </p>
            <Button className="gap-2" onClick={handleReset}>
              <Dumbbell className="h-4 w-4" /> Start New Workout
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
