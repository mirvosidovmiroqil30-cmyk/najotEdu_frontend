"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiGet, apiPost, ApiError, getToken, setToken, getRefreshToken, setRefreshToken } from "./api";
import type { Role, User } from "./types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_PATHS = ["/login"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiGet<User>("/auth/me")
      .then(setUser)
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!user && !isPublic) router.replace("/login");
    if (user && isPublic) router.replace(
      user.role === "STUDENT"
        ? "/student/dashboard"
        : user.role === "TEACHER"
        ? "/teacher/groups"
        : "/dashboard"
    );
  }, [loading, user, pathname, router]);

  const login = useCallback(
    async (phone: string, password: string) => {
      const res = await apiPost<{ access_token: string; refresh_token: string; user: User }>(
        "/auth/login",
        { phone, password },
      );
      setToken(res.access_token);
      setRefreshToken(res.refresh_token);
      setUser(res.user);
      router.replace(
        res.user.role === "STUDENT"
          ? "/student/dashboard"
          : res.user.role === "TEACHER"
          ? "/teacher/groups"
          : "/dashboard"
      );
    },
    [router],
  );

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  const value = useMemo(
    () => ({ user, loading, login, logout, hasRole }),
    [user, loading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}

export function formatApiError(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Nomaʼlum xatolik";
}
