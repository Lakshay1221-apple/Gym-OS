export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "trainer" | "member";
  gym: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Gym {
  _id: string;
  name: string;
  location: string;
  owner: string;
  logo?: string;
}

export interface MembershipPlan {
  _id: string;
  name: string;
  durationDays: number;
  price: number;
  description?: string;
  gym: string;
  createdBy: string;
  createdAt: string;
}

export interface Membership {
  _id: string;
  member: string | User;
  plan: string | MembershipPlan;
  gym: string;
  startDate: string;
  endDate: string;
  status: "active" | "grace" | "expired" | "cancelled" | "pending";
  graceUntil?: string;
  createdBy: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  member: string | User;
  amount: number;
  currency: string;
  method: "cash" | "upi" | "card" | "bank_transfer";
  status: "pending" | "completed" | "refunded";
  gym: string;
  membership?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Attendance {
  _id: string;
  member: string | User;
  gym: string;
  membership: string;
  checkInTime: string;
  checkOutTime?: string;
  method: "manual" | "qr" | "biometric";
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actor: string | User;
  action: string;
  entityType: string;
  entityId: string;
  gym: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface WorkoutProgram {
  _id: string;
  name: string;
  description?: string;
  trainer: string | User;
  createdBy: string | User;
  gym: string;
  durationWeeks?: number;
  workouts?: {
    dayName: string;
    exercises: {
      exerciseId: string | Exercise;
      targetSets: number;
      targetReps: number;
      restTime?: number;
    }[];
  }[];
  assignedTo: string[];
  createdAt: string;
}

export interface WorkoutSession {
  _id: string;
  member: string | User;
  program?: string | WorkoutProgram;
  assignment?: string;
  gym: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  caloriesBurned?: number;
  sets?: WorkoutSet[];
  date?: string;
  notes?: string;
  createdAt: string;
}

export interface WorkoutSet {
  _id: string;
  sessionId: string;
  exerciseId: string | Exercise;
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number;
  restTime?: number;
}

export interface Exercise {
  _id: string;
  exerciseName: string;
  muscleGroup: string;
  equipment?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export interface TrainerAssignment {
  _id: string;
  member: string | User;
  trainer: string | User;
  program: string | WorkoutProgram;
  gym: string;
  status: "active" | "completed" | "cancelled";
  startDate: string;
  createdAt: string;
}

export interface Biometric {
  _id: string;
  member: string;
  gym: string;
  date: string;
  weightInKg?: number;
  bodyFat?: number;
  muscleMass?: number;
  createdAt: string;
}

export interface Measurement {
  _id: string;
  member: string;
  gym: string;
  date: string;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RevenueMetrics {
  today: number;
  month: number;
  total: number;
  averagePlanValue: number;
  revenueByDay: { _id: string; total: number }[];
}

export interface AttendanceMetrics {
  todayTotal: number;
  activeNow: number;
  peakHours: { hour: number; visits: number }[];
}

export interface MembershipMetrics {
  active: number;
  grace: number;
  expired: number;
  cancelled: number;
  pending: number;
}

export interface TrainerMetrics {
  byStatus: { active: number; completed: number; cancelled: number };
  topTrainers: {
    _id: string;
    trainer: { name: string; email: string };
    activeClients: number;
  }[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterTenantPayload {
  gymName: string;
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  gym: string;
  token: string;
}
