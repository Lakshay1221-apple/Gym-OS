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
import type { Biometric } from "@/types";
import { Plus, Loader2, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function BiometricsPage() {
  const qc = useQueryClient();
  const [memberId, setMemberId] = useState("");
  const [searchId, setSearchId] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ memberId: "", weight: "", bodyFat: "", bmi: "", notes: "" });

  const { data: biometrics, isLoading } = useQuery({
    queryKey: ["biometrics", searchId],
    queryFn: () => api.get<Biometric[]>(`/api/biometrics/${searchId}`),
    enabled: !!searchId,
  });

  const recordBiometric = useMutation({
    mutationFn: (data: { memberId: string; date: string; weight?: number; bodyFat?: number; bmi?: number; notes?: string }) =>
      api.post("/api/biometrics", data),
    onSuccess: () => {
      toast.success("Biometric recorded");
      setOpen(false);
      setForm({ memberId: "", weight: "", bodyFat: "", bmi: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["biometrics"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const chartData = biometrics
    ?.slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((b) => ({
      date: formatDate(b.date),
      weight: b.weightInKg,
      bodyFat: b.bodyFat,
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Biometrics</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track member body metrics over time</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Record Biometric</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Biometric</DialogTitle>
              <DialogDescription>Log weight, body fat, and BMI for a member</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                recordBiometric.mutate({
                  memberId: form.memberId,
                  date: new Date().toISOString(),
                  weight: form.weight ? parseFloat(form.weight) : undefined,
                  bodyFat: form.bodyFat ? parseFloat(form.bodyFat) : undefined,
                  bmi: form.bmi ? parseFloat(form.bmi) : undefined,
                  notes: form.notes || undefined,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Member ID</Label>
                <Input placeholder="Member ObjectId" value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Body Fat (%)</Label>
                  <Input type="number" step="0.1" value={form.bodyFat} onChange={(e) => setForm({ ...form, bodyFat: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>BMI</Label>
                  <Input type="number" step="0.1" value={form.bmi} onChange={(e) => setForm({ ...form, bmi: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={recordBiometric.isPending}>
                {recordBiometric.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search member */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Member Biometrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter Member ID"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => setSearchId(memberId)} disabled={!memberId}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchId && (
        <>
          {isLoading ? (
            <Skeleton className="h-80 rounded-xl" />
          ) : biometrics && biometrics.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Weight chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Weight Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" tick={{ fill: "#999", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#999", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, color: "#f0f0f0" }} />
                      <Line type="monotone" dataKey="weight" stroke="#C8FF00" strokeWidth={2} dot={{ fill: "#C8FF00" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Body fat chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Body Fat %</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" tick={{ fill: "#999", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#999", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, color: "#f0f0f0" }} />
                      <Line type="monotone" dataKey="bodyFat" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Activity className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
                <p className="text-[var(--muted-foreground)]">No biometric data found for this member.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
