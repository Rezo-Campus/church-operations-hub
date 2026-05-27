import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, UserPlus } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  useEffect(() => {
    supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => {
      setHasUsers((count ?? 0) > 0);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: String(fd.get("email")),
        password: String(fd.get("password")),
      });
      if (error) throw error;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Identifiants incorrects");
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: String(fd.get("email")),
        password: String(fd.get("password")),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: String(fd.get("full_name")) },
        },
      });
      if (error) throw error;
      toast.success("Compte Administrateur Général créé. Connectez-vous maintenant.");
      setShowSignup(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setBusy(false);
    }
  };

  if (hasUsers === null) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Panneau gauche (desktop uniquement) ── */}
      <aside className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col bg-[#0f2557] text-white relative overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute bottom-10 -right-16 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full border border-white/5" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 py-16 text-center">
          <img
            src="/logo.png"
            alt="Croix EEC"
            className="h-28 w-28 object-contain mb-8 drop-shadow-2xl"
          />

          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-blue-300 mb-2">Présidence</p>
          <h1 className="text-2xl font-extrabold leading-snug uppercase tracking-wide">
            Église Évangélique<br />du Congo
          </h1>

          <div className="my-7 h-px w-14 bg-blue-300/40" />

          <p className="text-sm text-blue-100/80 leading-relaxed max-w-xs">
            Plateforme numérique centralisée au service de la numérisation des activités administratives de la Présidence de l'EEC.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 w-full max-w-xs">
            {[
              ["Personnel", "Ecclésiastique & Laïc"],
              ["Patrimoine", "Terrains & Bâtiments"],
              ["Stock", "Publications & Cartes"],
              ["Archives", "Documents internes"],
            ].map(([title, sub]) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left"
              >
                <p className="text-xs font-semibold text-white">{title}</p>
                <p className="text-[11px] text-blue-200/70 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 pb-6 text-center text-[11px] text-blue-300/50">
          Accès réservé aux administrateurs autorisés
        </p>
      </aside>

      {/* ── Panneau droit — formulaire ── */}
      <main className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-5 py-10 sm:px-10">

        {/* Logo + titre (mobile / tablette) */}
        <div className="flex lg:hidden flex-col items-center mb-8 text-center">
          <img src="/logo.png" alt="Croix EEC" className="h-20 w-20 object-contain mb-4" />
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#0f2557]/60 mb-1">Présidence</p>
          <h1 className="text-lg font-extrabold text-[#0f2557] uppercase leading-tight">
            Église Évangélique du Congo
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Plateforme de gestion administrative</p>
        </div>

        <div className="w-full max-w-[380px]">

          {!showSignup ? (
            /* ── FORMULAIRE DE CONNEXION ── */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900">Connexion</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Accédez à votre espace de gestion
              </p>

              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Adresse e-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="exemple@eec.cg"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPwd ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2 bg-[#0f2557] hover:bg-[#1a3a80] transition-colors"
                  disabled={busy}
                >
                  {busy ? "Connexion en cours…" : "Se connecter"}
                </Button>
              </form>

              {/* Lien créer un compte — toujours visible en bas */}
              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-xs text-muted-foreground">
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setShowSignup(true)}
                    className="font-semibold text-[#0f2557] hover:underline inline-flex items-center gap-1"
                  >
                    <UserPlus className="h-3 w-3" />
                    Créer un compte
                  </button>
                </p>
              </div>
            </div>

          ) : (
            /* ── FORMULAIRE DE CRÉATION DE COMPTE ── */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <button
                type="button"
                onClick={() => setShowSignup(false)}
                className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour à la connexion
              </button>

              <h2 className="text-xl font-bold text-gray-900">Créer un compte</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {"Créez un compte et contactez l'Administrateur Général pour vous attribuer des accès."}
              </p>

              <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-800">
                Une fois le compte créé, vérifiez votre boîte mail pour valider votre adresse e-mail avant de vous connecter.
              </div>

              <form onSubmit={handleSignup} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-sm font-medium">Nom complet</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    required
                    placeholder="La Présidence"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email2" className="text-sm font-medium">Adresse e-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email2"
                      name="email"
                      type="email"
                      required
                      placeholder="exemple@eec.cg"
                      className="pl-9"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password2" className="text-sm font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password2"
                      name="password"
                      type={showPwd ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Minimum 6 caractères"
                      className="pl-9 pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2 bg-[#0f2557] hover:bg-[#1a3a80] transition-colors"
                  disabled={busy}
                >
                  {busy ? "Création en cours…" : "Créer le compte"}
                </Button>
              </form>
            </div>
          )}

          <p className="mt-6 text-center text-[11px] text-muted-foreground/60">
            © {new Date().getFullYear()} Présidence EEC — Tous droits réservés
          </p>
        </div>
      </main>
    </div>
  );
}
