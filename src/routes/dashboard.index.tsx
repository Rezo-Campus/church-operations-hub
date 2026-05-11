import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, Package, Archive } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({ component: DashboardHome });

function DashboardHome() {
  const { user, isAdminGeneral, roles } = useAuth();
  const [stats, setStats] = useState({ personnel: 0, terrains: 0, batiments: 0, vehicules: 0, cartes: 0, archives: 0 });

  useEffect(() => {
    (async () => {
      const tables = ["personnel", "terrains", "batiments", "vehicules", "cartes_stock", "archives"] as const;
      const results = await Promise.all(tables.map((t) => supabase.from(t).select("*", { count: "exact", head: true })));
      setStats({
        personnel: results[0].count ?? 0,
        terrains: results[1].count ?? 0,
        batiments: results[2].count ?? 0,
        vehicules: results[3].count ?? 0,
        cartes: results[4].count ?? 0,
        archives: results[5].count ?? 0,
      });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bienvenue</h1>
        <p className="text-sm text-muted-foreground">{user?.email} {isAdminGeneral ? "— Administrateur Général" : roles.length ? `— ${roles.join(", ")}` : "— En attente d'attribution de rôle"}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Personnel" value={stats.personnel} />
        <StatCard icon={Building2} label="Terrains" value={stats.terrains} />
        <StatCard icon={Building2} label="Bâtiments" value={stats.batiments} />
        <StatCard icon={Building2} label="Véhicules" value={stats.vehicules} />
        <StatCard icon={Package} label="Mouvements cartes" value={stats.cartes} />
        <StatCard icon={Archive} label="Archives" value={stats.archives} />
      </div>

      {!isAdminGeneral && roles.length === 0 && (
        <Card>
          <CardHeader><CardTitle>Aucun accès attribué</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Contactez l'Administrateur Général pour obtenir l'accès à un module.</CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-md bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
