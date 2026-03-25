"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Biometric, Measurement } from "@/types";
import { Plus, Loader2, TrendingUp, Weight, Percent, Dumbbell } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BiometricHistory {
  biometrics: Biometric[];
  measurements: Measurement[];
}

export default function MemberProgressPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ weight: "", bodyFat: "", muscleMass: "" });

  const { data: history, isLoading } = useQuery({
    queryKey: ["biometric-history"],
    queryFn: () => api.get<BiometricHistory>("/api/biometrics/history"),
  });

  const logBiometric = useMutation({
    mutationFn: (body: { weight?: number; bodyFat?: number; muscleMass?: number }) =>
      api.post("/api/biometrics/log", body),
    onSuccess: () => {
      toast.success("Measurement logged");
      setOpen(false);
      setForm({ weight: "", bodyFat: "", muscleMass: "" });
      qc.invalidateQueries({ queryKey: ["biometric-history"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const biometrics = history?.biometrics || [];
  const sortedBiometrics = [...biometrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const weightData = sortedBiometrics
    .filter((b) => b.weightInKg != null)
    .map((b) => ({ date: formatDate(b.date), weightInKg: b.weightInKg }));

  const bodyFatData = sortedBiometrics
    .filter((b) => b.bodyFat != null)
    .map((b) => ({ date: formatDate(b.date), bodyFat: b.bodyFat }));

  const latestBiometric = sortedBiometrics[sortedBiometrics.length - 1];

  const hasData = biometrics.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Progress</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track your fitness journey</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Log Measurement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Measurement</DialogTitle>
              <DialogDescription>Record your current body metrics</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                logBiometric.mutate({
                  weight: form.weight ? parseFloat(form.weight) : undefined,
                  bodyFat: form.bodyFat ? parseFloat(form.bodyFat) : undefined,
                  muscleMass: form.muscleMass ? parseFloat(form.muscleMass) : undefined,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="75.0"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Body Fat (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="15.0"
                  value={form.bodyFat}
                  onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Muscle Mass (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="35.0"
                  value={form.muscleMass}
                  onChange={(e) => setForm({ ...form, muscleMass: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={logBiometric.isPending}>
                {logBiometric.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Measurement
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : hasData ? (
        <>
          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weight chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weight Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {weightData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" tick={{ fill: "#999", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#999", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, color: "#f0f0f0" }}
                        formatter={(v) => [`${v} kg`, "Weight"]}
                      />
                      <Line type="monotone" dataKey="weightInKg" stroke="#C8FF00" strokeWidth={2} dot={{ fill: "#C8FF00" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No weight data recorded yet</p>
                )}
              </CardContent>
            </Card>

            {/* Body fat chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Body Fat %</CardTitle>
              </CardHeader>
              <CardContent>
                {bodyFatData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={bodyFatData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" tick={{ fill: "#999", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#999", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, color: "#f0f0f0" }}
                        formatter={(v) => [`${v}%`, "Body Fat"]}
                      />
                      <Line type="monotone" dataKey="bodyFat" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No body fat data recorded yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Latest measurements */}
          {latestBiometric && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest Measurements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-[var(--accent)] p-4 text-center">
                    <Weight className="mx-auto mb-2 h-5 w-5 text-[var(--primary)]" />
                    <p className="text-2xl font-bold">
                      {latestBiometric.weightInKg != null ? `${latestBiometric.weightInKg} kg` : "—"}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">Weight</p>
                  </div>
                  <div className="rounded-lg bg-[var(--accent)] p-4 text-center">
                    <Percent className="mx-auto mb-2 h-5 w-5 text-red-400" />
                    <p className="text-2xl font-bold">
                      {latestBiometric.bodyFat != null ? `${latestBiometric.bodyFat}%` : "—"}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">Body Fat</p>
                  </div>
                  <div className="rounded-lg bg-[var(--accent)] p-4 text-center">
                    <Dumbbell className="mx-auto mb-2 h-5 w-5 text-blue-400" />
                    <p className="text-2xl font-bold">
                      {latestBiometric.muscleMass != null ? `${latestBiometric.muscleMass} kg` : "—"}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">Muscle Mass</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="text-[var(--muted-foreground)]">No progress data yet. Start logging your measurements!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
