"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Users,
  CreditCard,
  CalendarCheck,
  BarChart3,
  ClipboardList,
  Zap,
  Shield,
  ArrowRight,
  Check,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Users, title: "Membership Management", desc: "Track all members, plans, and subscription statuses in real-time." },
  { icon: CreditCard, title: "Automated Billing", desc: "Process payments, refunds, and auto-link memberships seamlessly." },
  { icon: CalendarCheck, title: "Attendance Tracking", desc: "Track check-ins, check-outs, and peak hours with analytics." },
  { icon: ClipboardList, title: "Trainer Programs", desc: "Create workout programs and assign them to members effortlessly." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Revenue charts, attendance heatmaps, and membership metrics." },
  { icon: Dumbbell, title: "Workout Logging", desc: "Members log sessions, sets, reps, and track their progress." },
];

const plans = [
  { name: "Starter", price: "Free", period: "forever", features: ["Up to 50 members", "Basic attendance", "1 admin user", "Community support"], cta: "Get Started" },
  { name: "Pro", price: "2,999", period: "/month", features: ["Unlimited members", "Full analytics", "5 admin users", "Automated billing", "Priority support"], cta: "Start Free Trial", popular: true },
  { name: "Enterprise", price: "Custom", period: "pricing", features: ["Multi-gym support", "Custom integrations", "Dedicated account manager", "SLA guarantee", "White-label option"], cta: "Contact Sales" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-[var(--primary)]" />
            <span className="text-xl font-bold">GymOS</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,255,0,0.08)_0%,transparent_50%)]" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--secondary)] px-4 py-1.5 text-sm">
              <Zap className="h-4 w-4 text-[var(--primary)]" />
              <span className="text-[var(--muted-foreground)]">Built for modern gyms</span>
            </div>
          </motion.div>
          <motion.h1
            className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Manage your Gym.{" "}
            <span className="text-[var(--primary)] neon-text">Automate everything.</span>
          </motion.h1>
          <motion.p
            className="mx-auto mb-10 max-w-2xl text-lg text-[var(--muted-foreground)] md:text-xl"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Memberships, billing, attendance, workouts, analytics — all in one platform.
            Built for gym owners who want to spend time training, not managing spreadsheets.
          </motion.p>
          <motion.div className="flex flex-col items-center justify-center gap-4 sm:flex-row" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base">
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-base">Login</Button>
            </Link>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
      </section>

      {/* Features */}
      <section id="features" className="relative px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div className="mb-16 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Everything you need to run your gym</h2>
            <p className="mx-auto max-w-2xl text-[var(--muted-foreground)]">
              A complete platform that handles memberships, payments, attendance, training programs, and analytics.
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 transition-all duration-300 hover:border-[var(--primary)]/30 hover:neon-glow"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="mb-4 inline-flex rounded-xl bg-[var(--primary)]/10 p-3">
                  <f.icon className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[var(--border)] px-6 py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { value: "500+", label: "Gyms Active" },
            { value: "50K+", label: "Members Managed" },
            { value: "1M+", label: "Check-ins Tracked" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat, i) => (
            <motion.div key={stat.label} className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <div className="text-3xl font-bold text-[var(--primary)] md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-[var(--muted-foreground)]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div className="mb-16 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Simple, transparent pricing</h2>
            <p className="text-[var(--muted-foreground)]">Start free, upgrade when you need more.</p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${plan.popular ? "border-[var(--primary)] neon-glow" : "border-[var(--border)]"} bg-[var(--card)]`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-bold text-black">
                    Most Popular
                  </div>
                )}
                <h3 className="mb-2 text-xl font-bold">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {plan.price === "Free" || plan.price === "Custom" ? plan.price : `₹${plan.price}`}
                  </span>
                  {plan.price !== "Free" && plan.price !== "Custom" && (
                    <span className="text-[var(--muted-foreground)]">{plan.period}</span>
                  )}
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-[var(--primary)]" />
                      <span className="text-[var(--muted-foreground)]">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button variant={plan.popular ? "default" : "outline"} className="w-full">{plan.cta}</Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <motion.div
          className="mx-auto max-w-4xl rounded-3xl border border-[var(--border)] bg-[var(--card)] p-12 text-center md:p-16"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <Shield className="mx-auto mb-6 h-12 w-12 text-[var(--primary)]" />
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to automate your gym?</h2>
          <p className="mx-auto mb-8 max-w-xl text-[var(--muted-foreground)]">
            Join hundreds of gym owners who switched from spreadsheets to GymOS.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">Get Started Free <ArrowRight className="h-5 w-5" /></Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-[var(--primary)]" />
            <span className="font-semibold">GymOS</span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            &copy; {new Date().getFullYear()} GymOS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
