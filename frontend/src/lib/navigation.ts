import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Dumbbell,
  BarChart3,
  Bell,
  FileText,
  ClipboardList,
  Activity,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function getRoleBasePath(role: "admin" | "trainer" | "member"): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "trainer":
      return "/trainer";
    case "member":
      return "/member";
  }
}

export const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/plans", label: "Plans", icon: FileText },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
];

export const trainerNavItems: NavItem[] = [
  { href: "/trainer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trainer/clients", label: "My Clients", icon: Users },
  { href: "/trainer/programs", label: "Programs", icon: Dumbbell },
  { href: "/trainer/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/trainer/biometrics", label: "Biometrics", icon: Activity },
];

export const memberNavItems: NavItem[] = [
  { href: "/member/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/member/workouts", label: "My Workouts", icon: Dumbbell },
  { href: "/member/workout-session", label: "Start Workout", icon: Timer },
  { href: "/member/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/member/progress", label: "Progress", icon: TrendingUp },
  { href: "/member/notifications", label: "Notifications", icon: Bell },
  { href: "/member/membership", label: "Membership", icon: CreditCard },
];
