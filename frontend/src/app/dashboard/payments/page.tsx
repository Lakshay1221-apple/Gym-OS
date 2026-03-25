"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Payment, PaginatedResponse, User, MembershipPlan } from "@/types";
import { Plus, Loader2, RefreshCcw } from "lucide-react";

const statusVariant = {
  completed: "success" as const,
  pending: "warning" as const,
  refunded: "destructive" as const,
};

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ memberId: "", planId: "", amount: "", method: "cash" as string });

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments", page],
    queryFn: () => api.get<PaginatedResponse<Payment>>(`/api/payments?page=${page}&limit=20`),
  });

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.get<MembershipPlan[]>("/api/plans"),
  });

  const createPayment = useMutation({
    mutationFn: (data: { memberId: string; planId?: string; amount: number; method: string }) =>
      api.post("/api/payments", data),
    onSuccess: () => {
      toast.success("Payment recorded");
      setOpen(false);
      setForm({ memberId: "", planId: "", amount: "", method: "cash" });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const refundPayment = useMutation({
    mutationFn: (id: string) => api.post(`/api/payments/${id}/refund`),
    onSuccess: () => {
      toast.success("Payment refunded");
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Record and manage payment transactions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Record Payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>Create a new payment entry and optionally link a plan</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPayment.mutate({
                  memberId: form.memberId,
                  planId: form.planId || undefined,
                  amount: parseInt(form.amount),
                  method: form.method,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Member ID</Label>
                <Input placeholder="Member ObjectId" value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Plan (optional)</Label>
                <Select value={form.planId} onValueChange={(v) => setForm({ ...form, planId: v })}>
                  <SelectTrigger><SelectValue placeholder="No plan — cash payment only" /></SelectTrigger>
                  <SelectContent>
                    {plans?.map((p) => (
                      <SelectItem key={p._id} value={p._id}>{p.name} — ₹{p.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createPayment.isPending}>
                {createPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.data?.map((p) => {
                    const member = p.member as User;
                    return (
                      <TableRow key={p._id}>
                        <TableCell>
                          <p className="font-medium">{member?.name || p.member?.toString()?.slice(-6) || "—"}</p>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell>
                        <TableCell className="capitalize">{p.method}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(p.createdAt)}</TableCell>
                        <TableCell>
                          {p.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-red-400 hover:text-red-300"
                              onClick={() => refundPayment.mutate(p._id)}
                              disabled={refundPayment.isPending}
                            >
                              <RefreshCcw className="h-3 w-3" /> Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!payments?.data || payments.data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-[var(--muted-foreground)]">
                        No payments recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {payments?.pagination && (
                <div className="p-4">
                  <Pagination page={page} pages={payments.pagination.pages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
