"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { WorkoutProgram, User } from "@/types";
import { Plus, Loader2, Dumbbell, UserPlus } from "lucide-react";

export default function WorkoutsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [assignMemberId, setAssignMemberId] = useState("");

  const { data: programs, isLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: () => api.get<WorkoutProgram[]>("/api/programs"),
  });

  const createProgram = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post("/api/programs", data),
    onSuccess: () => {
      toast.success("Program created");
      setCreateOpen(false);
      setForm({ name: "", description: "" });
      qc.invalidateQueries({ queryKey: ["programs"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const assignProgram = useMutation({
    mutationFn: ({ programId, memberId }: { programId: string; memberId: string }) =>
      api.post(`/api/programs/${programId}/assign`, { memberId }),
    onSuccess: () => {
      toast.success("Program assigned");
      setAssignOpen(false);
      setAssignMemberId("");
      qc.invalidateQueries({ queryKey: ["programs"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workout Programs</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Create programs and assign them to members</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create Program</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workout Program</DialogTitle>
              <DialogDescription>Define a new workout program for your members</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProgram.mutate({ name: form.name, description: form.description || undefined });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Program Name</Label>
                <Input placeholder="Beginner Strength" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="3-day split focusing on compound movements..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={createProgram.isPending}>
                {createProgram.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Program
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : programs && programs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((prog) => {
            const creator = prog.createdBy as User;
            return (
              <Card key={prog._id} className="transition-all hover:border-[var(--primary)]/30">
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="inline-flex rounded-xl bg-[var(--primary)]/10 p-2">
                      <Dumbbell className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <Badge variant="secondary">{prog.assignedTo?.length || 0} assigned</Badge>
                  </div>
                  <h3 className="text-lg font-semibold">{prog.name}</h3>
                  {prog.description && (
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">{prog.description}</p>
                  )}
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Created by {creator?.name || "—"} · {formatDate(prog.createdAt)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full gap-1"
                    onClick={() => { setSelectedProgram(prog); setAssignOpen(true); }}
                  >
                    <UserPlus className="h-3 w-3" /> Assign to Member
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Dumbbell className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="text-[var(--muted-foreground)]">No programs yet. Create your first workout program.</p>
          </CardContent>
        </Card>
      )}

      {/* Assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Program</DialogTitle>
            <DialogDescription>Assign &ldquo;{selectedProgram?.name}&rdquo; to a member</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedProgram && assignMemberId) {
                assignProgram.mutate({ programId: selectedProgram._id, memberId: assignMemberId });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Member ID</Label>
              <Input placeholder="Member ObjectId" value={assignMemberId} onChange={(e) => setAssignMemberId(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={assignProgram.isPending || !assignMemberId}>
              {assignProgram.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
