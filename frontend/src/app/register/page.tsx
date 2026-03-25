"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const { registerTenant } = useAuth();
  const [form, setForm] = useState({
    gymName: "",
    location: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
  });
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await registerTenant(form);
      toast.success("Gym registered successfully!");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,255,0,0.05)_0%,transparent_50%)]" />
      <Card className="relative z-10 w-full max-w-md border-[var(--border)]">
        <CardHeader className="text-center">
          <Link href="/" className="mb-4 flex items-center justify-center gap-2">
            <Dumbbell className="h-8 w-8 text-[var(--primary)]" />
            <span className="text-2xl font-bold">GymOS</span>
          </Link>
          <CardTitle className="text-2xl">Register your gym</CardTitle>
          <CardDescription>Create your gym management account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gymName">Gym Name</Label>
              <Input
                id="gymName"
                placeholder="Iron Paradise Fitness"
                value={form.gymName}
                onChange={(e) => update("gymName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Mumbai, India"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                placeholder="John Doe"
                value={form.ownerName}
                onChange={(e) => update("ownerName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Email</Label>
              <Input
                id="ownerEmail"
                type="email"
                placeholder="owner@gym.com"
                value={form.ownerEmail}
                onChange={(e) => update("ownerEmail", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPassword">Password</Label>
              <Input
                id="ownerPassword"
                type="password"
                placeholder="Minimum 6 characters"
                value={form.ownerPassword}
                onChange={(e) => update("ownerPassword", e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--primary)] hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
