import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, ArrowDown, ArrowUp, Package, TrendingUp, Wallet } from "lucide-react";
import { AccessDenied } from "./dashboard.rh";

export const Route = createFileRoute("/dashboard/stock")({ component: StockPage });

const ARTICLE_GROUPS = [
  {
    label: "Publications & Articles",
    items: ["Pain dominicale", "Guide Biblique", "Manuel Catécumen", "Liturgie du Centenaire", "Médailles"],
  },
  {
    label: "Cartes",
    items: ["Cotisation", "Baptêmes", "Bénédiction d'enfant", "Mariage", "Diacre", "Catéchisme"],
  },
];

const ALL_ARTICLES = ARTICLE_GROUPS.flatMap((g) => g.items);

interface Mvt {
  id: string;
  mouvement: "Entree" | "Sortie";
  quantite: number;
  type_article: string;
  cout_acquisition: number | null;
  prix_vente: number | null;
  numero_serie_debut: string | null;
  numero_serie_fin: string | null;
  beneficiaire: string | null;
  motif: string | null;
  date_mouvement: string;
  observation: string | null;
}

const EMPTY_FORM = {
  mouvement: "Entree" as "Entree" | "Sortie",
  quantite: "",
  type_article: ALL_ARTICLES[0],
  cout_acquisition: "",
  prix_vente: "",
  numero_serie_debut: "",
  numero_serie_fin: "",
  beneficiaire: "",
  motif: "",
  date_mouvement: new Date().toISOString().slice(0, 10),
  observation: "",
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0 });
}

function StockPage() {
  const { user, hasRole, isAdminGeneral } = useAuth();
  const allowed = isAdminGeneral || hasRole("admin_stock");
  const [list, setList] = useState<Mvt[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<string>(ALL_ARTICLES[0]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ ...EMPTY_FORM });

  const load = async () => {
    const { data } = await supabase.from("cartes_stock").select("*").order("date_mouvement", { ascending: false });
    setList(((data ?? []) as unknown) as Mvt[]);
  };

  useEffect(() => { if (allowed) load(); }, [allowed]);

  const openDialog = () => {
    setF({ ...EMPTY_FORM, type_article: selectedArticle });
    setOpen(true);
  };

  const filtered = useMemo(() => {
    let result = list.filter((m) => (m.type_article ?? "") === selectedArticle);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.beneficiaire?.toLowerCase().includes(q) ||
          m.motif?.toLowerCase().includes(q) ||
          m.observation?.toLowerCase().includes(q) ||
          m.date_mouvement.includes(q),
      );
    }
    return result;
  }, [list, selectedArticle, search]);

  const totals = useMemo(() => {
    const entrees = filtered.filter((m) => m.mouvement === "Entree").reduce((s, m) => s + m.quantite, 0);
    const sorties = filtered.filter((m) => m.mouvement === "Sortie").reduce((s, m) => s + m.quantite, 0);
    const solde = entrees - sorties;

    const totalEncaisse = filtered
      .filter((m) => m.mouvement === "Sortie" && m.prix_vente != null)
      .reduce((s, m) => s + m.quantite * (m.prix_vente ?? 0), 0);

    const entries_with_cost = filtered.filter((m) => m.mouvement === "Entree" && m.cout_acquisition != null);
    const avgCout =
      entries_with_cost.length > 0
        ? entries_with_cost.reduce((s, m) => s + (m.cout_acquisition ?? 0), 0) / entries_with_cost.length
        : null;
    const valeurStock = avgCout != null ? solde * avgCout : null;

    return { entrees, sorties, solde, totalEncaisse, valeurStock };
  }, [filtered]);

  if (!allowed) return <AccessDenied />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(f.quantite);
    if (!q || q <= 0) return toast.error("Quantité invalide");
    const payload = {
      mouvement: f.mouvement,
      quantite: q,
      type_article: f.type_article,
      cout_acquisition: f.cout_acquisition !== "" ? Number(f.cout_acquisition) : null,
      prix_vente: f.prix_vente !== "" ? Number(f.prix_vente) : null,
      numero_serie_debut: f.numero_serie_debut || null,
      numero_serie_fin: f.numero_serie_fin || null,
      beneficiaire: f.beneficiaire || null,
      motif: f.motif || null,
      date_mouvement: f.date_mouvement,
      observation: f.observation || null,
      created_by: user?.id,
    };
    const { error } = await supabase.from("cartes_stock").insert(payload as never);
    if (error) return toast.error(error.message);
    toast.success("Mouvement enregistré");
    setOpen(false);
    setSelectedArticle(f.type_article);
    load();
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Stock — Publications & Cartes</h1>
          <p className="text-sm text-muted-foreground">Gestion des entrées et sorties par article</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={openDialog}>
          <Plus className="mr-2 h-4 w-4" />Nouveau mouvement
        </Button>
      </div>

      {/* Sélecteur d'article + Recherche */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-72">
          <Select value={selectedArticle} onValueChange={setSelectedArticle}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un article" />
            </SelectTrigger>
            <SelectContent>
              {ARTICLE_GROUPS.map((g) => (
                <SelectGroup key={g.label}>
                  <SelectLabel>{g.label}</SelectLabel>
                  {g.items.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          className="flex-1"
          placeholder="Rechercher par bénéficiaire, motif, date…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded bg-emerald-500/10 p-2 text-emerald-600"><ArrowDown className="h-5 w-5" /></div>
            <div>
              <div className="text-xl font-bold">{totals.entrees}</div>
              <div className="text-xs text-muted-foreground">Entrées</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded bg-rose-500/10 p-2 text-rose-600"><ArrowUp className="h-5 w-5" /></div>
            <div>
              <div className="text-xl font-bold">{totals.sorties}</div>
              <div className="text-xs text-muted-foreground">Sorties</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded bg-primary/10 p-2 text-primary"><Package className="h-5 w-5" /></div>
            <div>
              <div className="text-xl font-bold">{totals.solde}</div>
              <div className="text-xs text-muted-foreground">En stock</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded bg-amber-500/10 p-2 text-amber-600"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <div className="text-xl font-bold">{fmt(totals.totalEncaisse)}</div>
              <div className="text-xs text-muted-foreground">Total encaissé</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded bg-violet-500/10 p-2 text-violet-600"><Wallet className="h-5 w-5" /></div>
            <div>
              <div className="text-xl font-bold">{totals.valeurStock != null ? fmt(totals.valeurStock) : "—"}</div>
              <div className="text-xs text-muted-foreground">Valeur stock</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog nouveau mouvement */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau mouvement — {f.type_article}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Article *</Label>
              <Select value={f.type_article} onValueChange={(v) => setF({ ...f, type_article: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ARTICLE_GROUPS.map((g) => (
                    <SelectGroup key={g.label}>
                      <SelectLabel>{g.label}</SelectLabel>
                      {g.items.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={f.mouvement} onValueChange={(v) => setF({ ...f, mouvement: v as "Entree" | "Sortie" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entree">Entrée</SelectItem>
                  <SelectItem value="Sortie">Sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantité *</Label>
              <Input type="number" min="1" required value={f.quantite} onChange={(e) => setF({ ...f, quantite: e.target.value })} />
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" required value={f.date_mouvement} onChange={(e) => setF({ ...f, date_mouvement: e.target.value })} />
            </div>
            <div>
              <Label>Coût d'acquisition</Label>
              <Input type="number" min="0" step="any" placeholder="0" value={f.cout_acquisition} onChange={(e) => setF({ ...f, cout_acquisition: e.target.value })} />
            </div>
            <div>
              <Label>Prix de vente</Label>
              <Input type="number" min="0" step="any" placeholder="0" value={f.prix_vente} onChange={(e) => setF({ ...f, prix_vente: e.target.value })} />
            </div>
            <div>
              <Label>N° série début</Label>
              <Input value={f.numero_serie_debut} onChange={(e) => setF({ ...f, numero_serie_debut: e.target.value })} />
            </div>
            <div>
              <Label>N° série fin</Label>
              <Input value={f.numero_serie_fin} onChange={(e) => setF({ ...f, numero_serie_fin: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Bénéficiaire / Source</Label>
              <Input value={f.beneficiaire} onChange={(e) => setF({ ...f, beneficiaire: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Motif</Label>
              <Input value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Observation</Label>
              <Textarea value={f.observation} onChange={(e) => setF({ ...f, observation: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tableau des mouvements */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qté</TableHead>
                <TableHead className="text-right">Coût acq.</TableHead>
                <TableHead className="text-right">Prix vente</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>N° série</TableHead>
                <TableHead>Bénéf./Source</TableHead>
                <TableHead>Motif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Aucun mouvement pour « {selectedArticle} »
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => {
                  const montant =
                    m.mouvement === "Sortie" && m.prix_vente != null
                      ? m.quantite * m.prix_vente
                      : m.mouvement === "Entree" && m.cout_acquisition != null
                      ? m.quantite * m.cout_acquisition
                      : null;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>{m.date_mouvement}</TableCell>
                      <TableCell>
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${m.mouvement === "Entree" ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"}`}>
                          {m.mouvement === "Entree" ? "Entrée" : "Sortie"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{m.quantite}</TableCell>
                      <TableCell className="text-right">{m.cout_acquisition != null ? fmt(m.cout_acquisition) : "—"}</TableCell>
                      <TableCell className="text-right">{m.prix_vente != null ? fmt(m.prix_vente) : "—"}</TableCell>
                      <TableCell className="text-right font-semibold">{montant != null ? fmt(montant) : "—"}</TableCell>
                      <TableCell className="text-sm">{m.numero_serie_debut ? `${m.numero_serie_debut} → ${m.numero_serie_fin ?? "—"}` : "—"}</TableCell>
                      <TableCell>{m.beneficiaire ?? "—"}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{m.motif ?? "—"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
