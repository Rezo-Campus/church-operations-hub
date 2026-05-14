import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { createAdmin, setUserRoles, deleteAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/dashboard/admin")({ component: AdminPage });

const ALL_ROLES: AppRole[] = ["admin_general", "admin_rh", "admin_patrimoine", "admin_stock", "admin_archives"];
const ROLE_LABEL: Record<AppRole, string> = {
  admin_general: "Admin Général",
  admin_rh: "RH",
  admin_patrimoine: "Patrimoine",
  admin_stock: "Stock",
  admin_archives: "Archives",
};

interface UserRow { id: string; email: string | null; full_name: string | null; roles: AppRole[]; }

function AdminPage() {
  const { isAdminGeneral, user } = useAuth();
  const createFn = useServerFn(createAdmin);
  const setRolesFn = useServerFn(setUserRoles);
  const delFn = useServerFn(deleteAdmin);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ email: "", password: "", full_name: "", roles: [] as AppRole[] });

  const load = async () => {
    const { data: profs } = await supabase.from("profiles").select("id, email, full_name");
    const { data: rs } = await supabase.from("user_roles").select("user_id, role");
    const map = new Map<string, AppRole[]>();
    (rs ?? []).forEach((r: any) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role); map.set(r.user_id, arr);
    });
    setUsers((profs ?? []).map((p: any) => ({ id: p.id, email: p.email, full_name: p.full_name, roles: map.get(p.id) ?? [] })));
  };
  useEffect(() => { if (isAdminGeneral) load(); }, [isAdminGeneral]);

  if (!isAdminGeneral) return <Card><CardContent className="p-8 text-center text-muted-foreground">Réservé à l'Administrateur Général.</CardContent></Card>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.roles.length) return toast.error("Sélectionnez au moins un rôle");
    setBusy(true);
    try {
      await createFn({ data: f });
      toast.success("Compte créé");
      setOpen(false);
      setF({ email: "", password: "", full_name: "", roles: [] });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setBusy(false); }
  };

  const toggleRole = (uid: string, role: AppRole, checked: boolean) => {
    setUsers((prev) => prev.map((u) => u.id === uid ? { ...u, roles: checked ? [...u.roles, role] : u.roles.filter((r) => r !== role) } : u));
  };

  const saveRoles = async (u: UserRow) => {
    try { await setRolesFn({ data: { user_id: u.id, roles: u.roles } }); toast.success("Rôles mis à jour"); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Erreur"); }
  };

  const remove = async (uid: string) => {
    if (!confirm("Supprimer ce compte ?")) return;
    try { await delFn({ data: { user_id: uid } }); toast.success("Supprimé"); load(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Erreur"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Gestion des accès</h1>
          <p className="text-sm text-muted-foreground">Créez les comptes des autres administrateurs et attribuez leurs accès.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Nouveau compte admin</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Créer un compte administrateur</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Nom complet *</Label><Input required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
              <div><Label>Email *</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
              <div><Label>Mot de passe initial *</Label><Input type="password" minLength={6} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
              <div>
                <Label>Rôles à attribuer *</Label>
                <div className="mt-2 space-y-2">
                  {ALL_ROLES.filter((r) => r !== "admin_general").map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={f.roles.includes(r)} onCheckedChange={(v) => setF((s) => ({ ...s, roles: v ? [...s.roles, r] : s.roles.filter((x) => x !== r) }))} />
                      {ROLE_LABEL[r]}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "..." : "Créer le compte"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Utilisateur</TableHead><TableHead>Email</TableHead><TableHead>Rôles</TableHead><TableHead className="w-32">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === user?.id;
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "—"} {isSelf && <span className="ml-2 text-xs text-muted-foreground">(vous)</span>}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {ALL_ROLES.map((r) => (
                        <label key={r} className={`flex items-center gap-1 rounded border px-2 py-1 text-xs ${u.roles.includes(r) ? "bg-primary/10 border-primary/30" : ""}`}>
                          <Checkbox className="h-3 w-3" disabled={isSelf && r === "admin_general"} checked={u.roles.includes(r)} onCheckedChange={(v) => toggleRole(u.id, r, !!v)} />
                          {ROLE_LABEL[r]}
                        </label>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => saveRoles(u)}><Save className="h-4 w-4" /></Button>
                      {!isSelf && <Button size="sm" variant="ghost" onClick={() => remove(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
