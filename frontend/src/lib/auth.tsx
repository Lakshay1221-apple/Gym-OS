"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";
import { getRoleBasePath } from "./navigation";
import type { AuthResponse, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerTenant: (data: {
    gymName: string;
    location: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("gymos_token");
    if (saved) {
      setToken(saved);
      api
        .get<User>("/api/auth/profile")
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("gymos_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<AuthResponse>("/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("gymos_token", res.token);
      setToken(res.token);
      setUser({
        _id: res._id,
        name: res.name,
        email: res.email,
        role: res.role as User["role"],
        gym: res.gym,
        createdAt: "",
        updatedAt: "",
      });
      router.push(getRoleBasePath(res.role as User["role"]) + "/dashboard");
    },
    [router]
  );

  const registerTenant = useCallback(
    async (data: {
      gymName: string;
      location: string;
      ownerName: string;
      ownerEmail: string;
      ownerPassword: string;
    }) => {
      const res = await api.post<{
        message: string;
        gymId: string;
        owner: { _id: string; email: string; token: string };
      }>("/api/auth/register-gym", data);
      localStorage.setItem("gymos_token", res.owner.token);
      setToken(res.owner.token);
      // Fetch full profile now that we have the token
      const profile = await api.get<User>("/api/auth/profile");
      setUser(profile);
      router.push("/admin/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("gymos_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, registerTenant, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
