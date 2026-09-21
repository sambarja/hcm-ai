"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const onLogin = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !onLogin) router.replace("/login");
    if (user && onLogin) router.replace("/");
  }, [user, loading, onLogin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[13px] text-ink-2">
        Loading…
      </div>
    );
  }

  if (!user && !onLogin) return null;
  if (user && onLogin) return null;

  return <>{children}</>;
}
