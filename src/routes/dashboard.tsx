import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, Users, Building2, Package, Archive, ShieldCheck, LayoutDashboard, Menu } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout });

interface NavItem { to: string; label: string; icon: typeof Users; role: AppRole | "any"; }

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, role: "any" },
  { to: "/dashboard/rh", label: "Ressources Humaines", icon: Users, role: "admin_rh" },
  { to: "/dashboard/patrimoine", label: "Patrimoine", icon: Building2, role: "admin_patrimoine" },
  { to: "/dashboard/stock", label: "Stock — Cartes", icon: Package, role: "admin_stock" },
  { to: "/dashboard/archives", label: "Archives", icon: Archive, role: "admin_archives" },
  { to: "/dashboard/admin", label: "Gestion des accès", icon: ShieldCheck, role: "admin_general" },
];

function DashboardLayout() {
  const { user, loading, roles, isAdminGeneral, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  useEffect(() => { setMobileOpen(false); }, [path]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center">Chargement…</div>;

  const visible = NAV.filter((n) => n.role === "any" || isAdminGeneral || roles.includes(n.role as AppRole));

  const SidebarContent = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">EEC</div>
        <div className="text-sm font-semibold">Gestion EEC</div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visible.map((n) => {
          const active = path === n.to;
          return (
            <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"}`}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-2 text-xs opacity-70 truncate">{user.email}</div>
        <div className="mb-2 px-2 text-xs">
          {isAdminGeneral && <span className="rounded bg-sidebar-primary px-2 py-0.5 text-sidebar-primary-foreground">Admin Général</span>}
          {!isAdminGeneral && roles.length === 0 && <span className="opacity-60">Aucun rôle attribué</span>}
        </div>
        <Button variant="secondary" size="sm" className="w-full" onClick={() => signOut().then(() => nav({ to: "/login" }))}>
          <LogOut className="mr-2 h-4 w-4" /> Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        {SidebarContent}
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="md:hidden flex items-center justify-between border-b bg-card px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground flex flex-col">
                {SidebarContent}
              </SheetContent>
            </Sheet>
            <div className="font-semibold">EEC</div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => signOut().then(() => nav({ to: "/login" }))}><LogOut className="h-4 w-4" /></Button>
        </div>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
