import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin_general" | "admin_rh" | "admin_patrimoine" | "admin_stock" | "admin_archives";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  isAdminGeneral: boolean;
  hasRole: (r: AppRole) => boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = async (uid: string | undefined) => {
    if (!uid) { setRoles([]); return; }
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (error) console.error("[auth] loadRoles error:", error.message);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  useEffect(() => {
    let uid: string | undefined;

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      uid = s?.user?.id;
      setSession(s);
      setUser(s?.user ?? null);
      setTimeout(() => loadRoles(s?.user?.id), 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      uid = data.session?.user?.id;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      loadRoles(data.session?.user?.id).finally(() => setLoading(false));
    });

    // Recharge les rôles en temps réel si l'admin les modifie
    const channel = supabase
      .channel("user_roles_watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, (payload: any) => {
        if (payload.new?.user_id === uid || payload.old?.user_id === uid) {
          loadRoles(uid);
        }
      })
      .subscribe();

    return () => {
      sub.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const value: AuthContextValue = {
    user, session, roles, loading,
    isAdminGeneral: roles.includes("admin_general"),
    hasRole: (r) => roles.includes(r),
    signOut: async () => { await supabase.auth.signOut(); },
    refreshRoles: () => loadRoles(user?.id),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
