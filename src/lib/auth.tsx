"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import teamData from "@/data/team.json";
import type { TeamMember } from "@/types";

const STORAGE_KEY = "hcm-ai-pm.user";

type AuthContextValue = {
  user: TeamMember | null;
  loading: boolean;
  signIn: (memberId: string) => TeamMember | null;
  signOut: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const id = JSON.parse(raw) as string;
        const found = (teamData as TeamMember[]).find((m) => m.id === id) ?? null;
        setUser(found);
      }
    } catch {
      // localStorage disabled or bad JSON — treat as signed out.
    }
    setLoading(false);
  }, []);

  function signIn(memberId: string) {
    const found = (teamData as TeamMember[]).find((m) => m.id === memberId) ?? null;
    if (found) {
      setUser(found);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(found.id));
      } catch {}
    }
    return found;
  }

  function signOut() {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, isAdmin: user?.accessLevel === "Admin" }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
