import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/rh")({ component: RHPage });

const TYPES = ["Consistoire", "Departement", "Institut theologique", "Centre de Sante"] as const;
const CATS = ["Ecclesiastique", "Non-Ecclesiastique"] as const;

interface Personnel {
  id: string; type: string; categorie: string; nom: string; prenom: string;
  date_naissance: string | null; lieu_naissance: string | null;
  date_bapteme: string | null; lieu_bapteme: string | null;
  niveau_etude: string | null; lieu_etude: string | null;
  fonction: string | null; lieu_service: string | null;
}

function RHPage() {
  const { user, hasRole, isAdminGeneral } = useAuth();
  const allowed = isAdminGeneral || hasRole("admin_rh");
  const [list, setList] = useState<Personnel[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "", categorie: "", nom: "", prenom: "", date_naissance: "", lieu_naissance: "", date_bapteme: "", lieu_bapteme: "", niveau_etude: "", lieu_etude: "", fonction: "", lieu_service: "" });

  const load = async () => {
    const { data, error } = await supabase.from("personnel").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setList((data ?? []) as Personnel[]);
  };
  useEffect(() => { if (allowed) load(); }, [allowed]);

  if (!allowed) return <AccessDenied />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type || !form.categorie || !form.nom || !form.prenom) { toast.error("Type, catégorie, nom et prénom requis"); return; }
    const payload = {
      ...form,
      date_naissance: form.date_naissance || null,
      date_bapteme: form.date_bapteme || null,
      created_by: user?.id,
    };
    const { error } = await supabase.from("personnel").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Personnel enregistré");
    setOpen(false);
    setForm({ type: "", categorie: "", nom: "", prenom: "", date_naissance: "", lieu_naissance: "", date_bapteme: "", lieu_bapteme: "", niveau_etude: "", lieu_etude: "", fonction: "", lieu_service: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ressources Humaines</h1>
          <p className="text-sm text-muted-foreground">Personnel de l'Église Évangélique du Congo</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nouveau personnel</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Enregistrer un personnel</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="grid grid-cols-2 gap-4">
              <div><Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Catégorie *</Label>
                <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></div>
              <div><Label>Prénom *</Label><Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required /></div>
              <div><Label>Date de naissance</Label><Input type="date" value={form.date_naissance} onChange={(e) => setForm({ ...form, date_naissance: e.target.value })} /></div>
              <div><Label>Lieu de naissance</Label><Input value={form.lieu_naissance} onChange={(e) => setForm({ ...form, lieu_naissance: e.target.value })} /></div>
              <div><Label>Date de baptême</Label><Input type="date" value={form.date_bapteme} onChange={(e) => setForm({ ...form, date_bapteme: e.target.value })} /></div>
              <div><Label>Lieu de baptême</Label><Input value={form.lieu_bapteme} onChange={(e) => setForm({ ...form, lieu_bapteme: e.target.value })} /></div>
              <div><Label>Niveau d'étude</Label><Input value={form.niveau_etude} onChange={(e) => setForm({ ...form, niveau_etude: e.target.value })} /></div>
              <div><Label>Lieu d'étude</Label><Input value={form.lieu_etude} onChange={(e) => setForm({ ...form, lieu_etude: e.target.value })} /></div>
              <div><Label>Fonction</Label><Input value={form.fonction} onChange={(e) => setForm({ ...form, fonction: e.target.value })} /></div>
              <div><Label>Lieu de service</Label><Input value={form.lieu_service} onChange={(e) => setForm({ ...form, lieu_service: e.target.value })} /></div>
              <div className="col-span-2"><Button type="submit" className="w-full">Enregistrer</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Nom & Prénom</TableHead><TableHead>Type</TableHead><TableHead>Catégorie</TableHead>
            <TableHead>Fonction</TableHead><TableHead>Lieu de service</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun personnel enregistré</TableCell></TableRow>
            ) : list.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nom} {p.prenom}</TableCell>
                <TableCell>{p.type}</TableCell><TableCell>{p.categorie}</TableCell>
                <TableCell>{p.fonction ?? "—"}</TableCell><TableCell>{p.lieu_service ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

export function AccessDenied() {
  return <Card><CardContent className="p-8 text-center text-muted-foreground">Accès refusé. Cet espace est réservé aux administrateurs autorisés.</CardContent></Card>;
}
