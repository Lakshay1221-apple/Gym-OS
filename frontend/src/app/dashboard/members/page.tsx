"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { User, PaginatedResponse, Membership, MembershipPlan } from "@/types";
import { UserPlus, Loader2 } from "lucide-react";

const statusVariant = {
  active: "success" as const,
  grace: "warning" as const,
  expired: "destructive" as const,
  cancelled: "secondary" as const,
  pending: "outline" as const,
};

export default function MembersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [regOpen, setRegOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "" });

  // Fetch members (register endpoint returns users, but for listing we get memberships)
  // The backend doesn't have a dedicated "list members" endpoint, so we'll
  // work with memberships list which populates member info.
  const { data: memberships, isLoading } = useQuery({
    queryKey: ["memberships", page],
    queryFn: () => api.get<PaginatedResponse<Membership>>(`/api/memberships?page=${page}&limit=20`),
  });

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.get<MembershipPlan[]>("/api/plans"),
  });

  const registerMember = useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      api.post("/api/auth/register", data),
    onSuccess: () => {
      toast.success("Member registered");
      setRegOpen(false);
      setRegForm({ name: "", email: "", password: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const assignMembership = useMutation({
    mutationFn: (data: { memberId: string; planId: string }) =>
      api.post("/api/memberships/purchase", data),
    onSuccess: () => {
      toast.success("Membership assigned");
      setAssignOpen(false);
      qc.invalidateQueries({ queryKey: ["memberships"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const [assignPlanId, setAssignPlanId] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Manage gym members and their memberships</p>
        </div>
        <Dialog open={regOpen} onOpenChange={setRegOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="h-4 w-4" /> Register Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Member</DialogTitle>
              <DialogDescription>Add a new member to your gym</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerMember.mutate(regForm);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={registerMember.isPending}>
                {registerMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register
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
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships?.data?.map((m) => {
                    const member = m.member as User;
                    const plan = m.plan as MembershipPlan;
                    return (
                      <TableRow key={m._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{member?.name || "—"}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{member?.email || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{plan?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[m.status]}>{m.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(m.startDate)}</TableCell>
                        <TableCell className="text-sm">{formatDate(m.endDate)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setAssignOpen(true);
                            }}
                          >
                            Assign Plan
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!memberships?.data || memberships.data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-[var(--muted-foreground)]">
                        No memberships found. Register members and assign plans to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {memberships?.pagination && (
                <div className="p-4">
                  <Pagination page={page} pages={memberships.pagination.pages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Assign membership dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Membership</DialogTitle>
            <DialogDescription>Assign a plan to {selectedMember?.name}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedMember && assignPlanId) {
                assignMembership.mutate({ memberId: selectedMember._id, planId: assignPlanId });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <Select value={assignPlanId} onValueChange={setAssignPlanId}>
                <SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger>
                <SelectContent>
                  {plans?.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} — ₹{p.price} ({p.durationDays} days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={assignMembership.isPending || !assignPlanId}>
              {assignMembership.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
