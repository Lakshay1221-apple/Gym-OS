"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Biometric, TrainerAssignment, User } from "@/types";
import { Plus, Loader2, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TrainerBiometricsPage() {
  const qc = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ weight: "", bodyFat: "", muscleMass: "" });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["trainer", "my-clients"],
    queryFn: () => api.get<TrainerAssignment[]>("/api/programs/my-clients"),
  });

  const activeClients = clients?.filter((c) => c.status === "active") || [];

  const { data: biometrics, isLoading: bioLoading } = useQuery({
    queryKey: ["trainer", "biometrics", selectedMemberId],
    queryFn: () => api.get<Biometric[]>(`/api/biometrics/${selectedMemberId}`),
    enabled: !!selectedMemberId,
  });

  const logBiometric = useMutation({
    mutationFn: (data: { weight?: number; bodyFat?: number; muscleMass?: number }) =>
      api.post("/api/biometrics/log", data),
    onSuccess: () => {
      toast.success("Biometric recorded");
      setOpen(false);
      setForm({ weight: "", bodyFat: "", muscleMass: "" });
      qc.invalidateQueries({ queryKey: ["trainer", "biometrics"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const chartData = biometrics
    ?.slice()
    .sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime())
    .map((b) => ({
      date: formatDate(b.date || b.createdAt),
      weight: b.weightInKg,
      bodyFat: b.bodyFat,
    })) || [];

  const selectedClient = activeClients.find((c) => {
    const member = c.member as User;
    return member?._id === selectedMemberId;
  });
  const selectedMemberName = (selectedClient?.member as User)?.name || "Selected Client";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Biometrics</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track member body metrics</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Log Biometric</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Biometric</DialogTitle>
              <DialogDescription>Record body metrics for the authenticated user</DialogDescription>
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
              <div className="grid grid-cols-3 gap-3">
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
                    placeholder="18.5"
                    value={form.bodyFat}
                    onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Muscle Mass (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="32.0"
                    value={form.muscleMass}
                    onChange={(e) => setForm({ ...form, muscleMass: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={logBiometric.isPending}>
                {logBiometric.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Client selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Client</CardTitle>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <Skeleton className="h-10" />
          ) : (
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a client to view biometrics" />
              </SelectTrigger>
              <SelectContent>
                {activeClients.map((assignment) => {
                  const member = assignment.member as User;
                  return (
                    <SelectItem key={assignment._id} value={member?._id || assignment._id}>
                      {member?.name || "Unknown"} — {member?.email || ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedMemberId ? (
        <>
          {bioLoading ? (
            <Skeleton className="h-80 rounded-xl" />
          ) : chartData.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Weight chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Weight Progress — {selectedMemberName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" tick={{ fill: "#999", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#999", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#141414",
                          border: "1px solid #262626",
                          borderRadius: 8,
                          color: "#f0f0f0",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#C8FF00"
                        strokeWidth={2}
                        dot={{ fill: "#C8FF00" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Body fat chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Body Fat % — {selectedMemberName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" tick={{ fill: "#999", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#999", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#141414",
                          border: "1px solid #262626",
                          borderRadius: 8,
                          color: "#f0f0f0",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bodyFat"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Activity className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
                <p className="text-[var(--muted-foreground)]">No biometric data found for this client.</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="text-[var(--muted-foreground)]">Select a client to view their biometric data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
