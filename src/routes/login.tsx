import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  // detect if any profile exists -> if not, show signup tab as default
  useEffect(() => {
    supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => {
      setHasUsers((count ?? 0) > 0);
    });
  }, []);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>, mode: "login" | "signup") => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const fullName = String(fd.get("full_name") || "");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success("Compte créé. Vous êtes Administrateur Général.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (hasUsers === null) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">EEC</div>
          <CardTitle>Plateforme EEC</CardTitle>
          <CardDescription>
            {hasUsers ? "Connectez-vous à votre espace administrateur" : "Première installation : créez le compte Administrateur Général"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={hasUsers ? "login" : "signup"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup" disabled={hasUsers}>Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={(e) => handleAuth(e, "login")} className="space-y-4 pt-4">
                <div><Label>Email</Label><Input name="email" type="email" required /></div>
                <div><Label>Mot de passe</Label><Input name="password" type="password" required /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "..." : "Se connecter"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={(e) => handleAuth(e, "signup")} className="space-y-4 pt-4">
                <div><Label>Nom complet</Label><Input name="full_name" required /></div>
                <div><Label>Email</Label><Input name="email" type="email" required /></div>
                <div><Label>Mot de passe</Label><Input name="password" type="password" minLength={6} required /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "..." : "Créer le compte"}</Button>
                {!hasUsers && <p className="text-xs text-muted-foreground">Ce premier compte deviendra automatiquement l'Administrateur Général.</p>}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
