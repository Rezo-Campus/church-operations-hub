import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, ArrowDown, ArrowUp, Package } from "lucide-react";
import { AccessDenied } from "./dashboard.rh";

export const Route = createFileRoute("/dashboard/stock")({ component: StockPage });

interface Mvt { id: string; mouvement: "Entree" | "Sortie"; quantite: number; numero_serie_debut: string | null; numero_serie_fin: string | null; beneficiaire: string | null; motif: string | null; date_mouvement: string; observation: string | null; }

function StockPage() {
  const { user, hasRole, isAdminGeneral } = useAuth();
  const allowed = isAdminGeneral || hasRole("admin_stock");
  const [list, setList] = useState<Mvt[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ mouvement: "Entree" as "Entree" | "Sortie", quantite: "", numero_serie_debut: "", numero_serie_fin: "", beneficiaire: "", motif: "", date_mouvement: new Date().toISOString().slice(0, 10), observation: "" });

  const load = async () => { const { data } = await supabase.from("cartes_stock").select("*").order("date_mouvement", { ascending: false }); setList((data ?? []) as Mvt[]); };
  useEffect(() => { if (allowed) load(); }, [allowed]);

  const totals = useMemo(() => {
    const e = list.filter((m) => m.mouvement === "Entree").reduce((s, m) => s + m.quantite, 0);
    const s = list.filter((m) => m.mouvement === "Sortie").reduce((s, m) => s + m.quantite, 0);
    return { entrees: e, sorties: s, solde: e - s };
  }, [list]);

  if (!allowed) return <AccessDenied />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(f.quantite);
    if (!q || q <= 0) return toast.error("Quantité invalide");
    const { error } = await supabase.from("cartes_stock").insert({ ...f, quantite: q, created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success("Mouvement enregistré"); setOpen(false); load();
    setF({ mouvement: "Entree", quantite: "", numero_serie_debut: "", numero_serie_fin: "", beneficiaire: "", motif: "", date_mouvement: new Date().toISOString().slice(0, 10), observation: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock — Cartes d'église</h1>
          <p className="text-sm text-muted-foreground">Gestion des entrées et sorties</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nouveau mouvement</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nouveau mouvement</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Type *</Label>
                <Select value={f.mouvement} onValueChange={(v) => setF({ ...f, mouvement: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Entree">Entrée</SelectItem><SelectItem value="Sortie">Sortie</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Quantité *</Label><Input type="number" min="1" required value={f.quantite} onChange={(e) => setF({ ...f, quantite: e.target.value })} /></div>
              <div><Label>N° série début</Label><Input value={f.numero_serie_debut} onChange={(e) => setF({ ...f, numero_serie_debut: e.target.value })} /></div>
              <div><Label>N° série fin</Label><Input value={f.numero_serie_fin} onChange={(e) => setF({ ...f, numero_serie_fin: e.target.value })} /></div>
              <div><Label>Date *</Label><Input type="date" required value={f.date_mouvement} onChange={(e) => setF({ ...f, date_mouvement: e.target.value })} /></div>
              <div><Label>Bénéficiaire / Source</Label><Input value={f.beneficiaire} onChange={(e) => setF({ ...f, beneficiaire: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Motif</Label><Input value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Observation</Label><Textarea value={f.observation} onChange={(e) => setF({ ...f, observation: e.target.value })} /></div>
              <div className="sm:col-span-2"><Button type="submit" className="w-full">Enregistrer</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded bg-emerald-500/10 p-3 text-emerald-600"><ArrowDown className="h-5 w-5" /></div><div><div className="text-2xl font-bold">{totals.entrees}</div><div className="text-xs text-muted-foreground">Entrées</div></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded bg-rose-500/10 p-3 text-rose-600"><ArrowUp className="h-5 w-5" /></div><div><div className="text-2xl font-bold">{totals.sorties}</div><div className="text-xs text-muted-foreground">Sorties</div></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded bg-primary/10 p-3 text-primary"><Package className="h-5 w-5" /></div><div><div className="text-2xl font-bold">{totals.solde}</div><div className="text-xs text-muted-foreground">Solde en stock</div></div></CardContent></Card>
      </div>

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Quantité</TableHead><TableHead>N° série</TableHead><TableHead>Bénéf./Source</TableHead><TableHead>Motif</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun mouvement</TableCell></TableRow>
            : list.map((m) => <TableRow key={m.id}>
                <TableCell>{m.date_mouvement}</TableCell>
                <TableCell><span className={`rounded px-2 py-0.5 text-xs ${m.mouvement === "Entree" ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"}`}>{m.mouvement}</span></TableCell>
                <TableCell className="font-medium">{m.quantite}</TableCell>
                <TableCell>{m.numero_serie_debut ? `${m.numero_serie_debut} → ${m.numero_serie_fin ?? "—"}` : "—"}</TableCell>
                <TableCell>{m.beneficiaire ?? "—"}</TableCell>
                <TableCell className="max-w-xs truncate">{m.motif ?? "—"}</TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
