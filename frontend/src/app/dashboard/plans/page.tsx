"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { MembershipPlan } from "@/types";
import { Plus, Loader2, FileText } from "lucide-react";

export default function PlansPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", durationDays: "", price: "", description: "" });

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.get<MembershipPlan[]>("/api/plans"),
  });

  const createPlan = useMutation({
    mutationFn: (data: { name: string; durationDays: number; price: number; description?: string }) =>
      api.post("/api/plans", data),
    onSuccess: () => {
      toast.success("Plan created");
      setOpen(false);
      setForm({ name: "", durationDays: "", price: "", description: "" });
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membership Plans</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Create and manage your gym pricing plans</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Plan</DialogTitle>
              <DialogDescription>Define a membership plan for your gym</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPlan.mutate({
                  name: form.name,
                  durationDays: parseInt(form.durationDays),
                  price: parseInt(form.price),
                  description: form.description || undefined,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input placeholder="Monthly Plan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (days)</Label>
                  <Input type="number" min={1} placeholder="30" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input type="number" min={0} placeholder="999" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea placeholder="Includes all facilities..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={createPlan.isPending}>
                {createPlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Plan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan._id} className="transition-all hover:border-[var(--primary)]/30">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex rounded-xl bg-[var(--primary)]/10 p-3">
                  <FileText className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-[var(--muted-foreground)]"> / {plan.durationDays} days</span>
                </div>
                {plan.description && (
                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">{plan.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="text-[var(--muted-foreground)]">No plans yet. Create your first plan.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
