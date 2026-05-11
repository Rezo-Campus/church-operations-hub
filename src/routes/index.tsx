import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, Building2, Package, Archive } from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">EEC</div>
            <div>
              <div className="text-sm font-semibold">Église Évangélique du Congo</div>
              <div className="text-xs text-muted-foreground">Plateforme de gestion intégrée</div>
            </div>
          </div>
          <Link to="/login"><Button>Connexion</Button></Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Gestion intégrée des activités de l'Église</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Ressources Humaines, Patrimoine, Stock et Archives — un seul espace, sécurisé et hiérarchisé.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/login"><Button size="lg">Accéder à la plateforme</Button></Link>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, title: "Ressources Humaines", desc: "Personnel ecclésiastique et non-ecclésiastique." },
            { icon: Building2, title: "Patrimoine", desc: "Terrains, bâtiments et véhicules." },
            { icon: Package, title: "Stock", desc: "Cartes d'église — entrées et sorties." },
            { icon: Archive, title: "Archives", desc: "Documents internes numérotés et tracés." },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border bg-card p-6 shadow-sm">
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-3xl rounded-lg border bg-secondary/40 p-6 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Accès contrôlé par l'Administrateur Général. Chaque service dispose de son propre administrateur.
          </p>
        </div>
      </main>
    </div>
  );
}
