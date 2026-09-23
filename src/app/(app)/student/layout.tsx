"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LoadingState } from "@/components/ui";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== "STUDENT") {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) return <LoadingState />;
  if (!user || user.role !== "STUDENT") return null;

  return <>{children}</>;
}
