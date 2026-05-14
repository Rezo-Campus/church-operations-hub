import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AccessDenied } from "./dashboard.rh";

export const Route = createFileRoute("/dashboard/patrimoine")({ component: PatrimoinePage });

const BAT_TYPES = ["Location", "Logement", "Centre de Sante", "Ecole", "Autre"] as const;

function PatrimoinePage() {
  const { hasRole, isAdminGeneral } = useAuth();
  const allowed = isAdminGeneral || hasRole("admin_patrimoine");
  if (!allowed) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Patrimoine</h1>
        <p className="text-sm text-muted-foreground">Terrains, bâtiments et véhicules de l'Église</p>
      </div>
      <Tabs defaultValue="terrains">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex"><TabsTrigger value="terrains">Terrains</TabsTrigger><TabsTrigger value="batiments">Bâtiments</TabsTrigger><TabsTrigger value="vehicules">Véhicules</TabsTrigger></TabsList>
        <TabsContent value="terrains"><TerrainsTab /></TabsContent>
        <TabsContent value="batiments"><BatimentsTab /></TabsContent>
        <TabsContent value="vehicules"><VehiculesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function TerrainsTab() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ valeur_type: "Don", valeur_montant: "", nombre: "1", lieu: "", superficie: "", bati: false, observation: "" });
  const load = async () => { const { data } = await supabase.from("terrains").select("*").order("created_at", { ascending: false }); setList(data ?? []); };
  useEffect(() => { load(); }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("terrains").insert({ ...f, valeur_montant: f.valeur_montant ? Number(f.valeur_montant) : null, nombre: Number(f.nombre) || 1, created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success("Terrain enregistré"); setOpen(false); load();
    setF({ valeur_type: "Don", valeur_montant: "", nombre: "1", lieu: "", superficie: "", bati: false, observation: "" });
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nouveau terrain</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nouveau terrain</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="grid grid-cols-2 gap-4">
              <div><Label>Type de valeur</Label>
                <Select value={f.valeur_type} onValueChange={(v) => setF({ ...f, valeur_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Don">Don</SelectItem><SelectItem value="Acte">Acté</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Montant (FCFA)</Label><Input type="number" value={f.valeur_montant} onChange={(e) => setF({ ...f, valeur_montant: e.target.value })} /></div>
              <div><Label>Nombre</Label><Input type="number" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></div>
              <div><Label>Superficie</Label><Input value={f.superficie} onChange={(e) => setF({ ...f, superficie: e.target.value })} placeholder="ex. 500 m²" /></div>
              <div className="col-span-2"><Label>Lieu *</Label><Input required value={f.lieu} onChange={(e) => setF({ ...f, lieu: e.target.value })} /></div>
              <div className="col-span-2 flex items-center gap-2"><Checkbox checked={f.bati} onCheckedChange={(v) => setF({ ...f, bati: !!v })} /><Label>Bâti</Label></div>
              <div className="col-span-2"><Label>Observation</Label><Textarea value={f.observation} onChange={(e) => setF({ ...f, observation: e.target.value })} /></div>
              <div className="col-span-2"><Button type="submit" className="w-full">Enregistrer</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Lieu</TableHead><TableHead>Valeur</TableHead><TableHead>Nombre</TableHead><TableHead>Superficie</TableHead><TableHead>Bâti</TableHead><TableHead>Observation</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun terrain</TableCell></TableRow>
            : list.map((t) => <TableRow key={t.id}><TableCell className="font-medium">{t.lieu}</TableCell><TableCell>{t.valeur_type}{t.valeur_montant ? ` — ${t.valeur_montant}` : ""}</TableCell><TableCell>{t.nombre}</TableCell><TableCell>{t.superficie ?? "—"}</TableCell><TableCell>{t.bati ? "Oui" : "Non"}</TableCell><TableCell className="max-w-xs truncate">{t.observation ?? "—"}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function BatimentsTab() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ type: "", nom: "", lieu: "", description: "", observation: "" });
  const load = async () => { const { data } = await supabase.from("batiments").select("*").order("created_at", { ascending: false }); setList(data ?? []); };
  useEffect(() => { load(); }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.type || !f.nom) return toast.error("Type et nom requis");
    const { error } = await supabase.from("batiments").insert({ ...f, created_by: user?.id } as never);
    if (error) return toast.error(error.message);
    toast.success("Bâtiment enregistré"); setOpen(false); load();
    setF({ type: "", nom: "", lieu: "", description: "", observation: "" });
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nouveau bâtiment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau bâtiment</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Type *</Label>
                <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{BAT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Nom / Désignation *</Label><Input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} required /></div>
              <div><Label>Lieu</Label><Input value={f.lieu} onChange={(e) => setF({ ...f, lieu: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
              <div><Label>Observation</Label><Textarea value={f.observation} onChange={(e) => setF({ ...f, observation: e.target.value })} /></div>
              <Button type="submit" className="w-full">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Type</TableHead><TableHead>Lieu</TableHead><TableHead>Observation</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun bâtiment</TableCell></TableRow>
            : list.map((b) => <TableRow key={b.id}><TableCell className="font-medium">{b.nom}</TableCell><TableCell>{b.type}</TableCell><TableCell>{b.lieu ?? "—"}</TableCell><TableCell className="max-w-xs truncate">{b.observation ?? "—"}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function VehiculesTab() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ marque: "", modele: "", immatriculation: "", annee: "", type_vehicule: "", numero_chassis: "", couleur: "", affectation: "", etat: "", observation: "" });
  const load = async () => { const { data } = await supabase.from("vehicules").select("*").order("created_at", { ascending: false }); setList(data ?? []); };
  useEffect(() => { load(); }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.marque) return toast.error("Marque requise");
    const { error } = await supabase.from("vehicules").insert({ ...f, annee: f.annee ? Number(f.annee) : null, created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success("Véhicule enregistré"); setOpen(false); load();
    setF({ marque: "", modele: "", immatriculation: "", annee: "", type_vehicule: "", numero_chassis: "", couleur: "", affectation: "", etat: "", observation: "" });
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nouveau véhicule</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nouveau véhicule</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="grid grid-cols-2 gap-4">
              <div><Label>Marque *</Label><Input required value={f.marque} onChange={(e) => setF({ ...f, marque: e.target.value })} /></div>
              <div><Label>Modèle</Label><Input value={f.modele} onChange={(e) => setF({ ...f, modele: e.target.value })} /></div>
              <div><Label>Immatriculation</Label><Input value={f.immatriculation} onChange={(e) => setF({ ...f, immatriculation: e.target.value })} /></div>
              <div><Label>Année</Label><Input type="number" value={f.annee} onChange={(e) => setF({ ...f, annee: e.target.value })} /></div>
              <div><Label>Type</Label><Input placeholder="Berline, 4x4..." value={f.type_vehicule} onChange={(e) => setF({ ...f, type_vehicule: e.target.value })} /></div>
              <div><Label>N° de châssis</Label><Input value={f.numero_chassis} onChange={(e) => setF({ ...f, numero_chassis: e.target.value })} /></div>
              <div><Label>Couleur</Label><Input value={f.couleur} onChange={(e) => setF({ ...f, couleur: e.target.value })} /></div>
              <div><Label>Affectation</Label><Input value={f.affectation} onChange={(e) => setF({ ...f, affectation: e.target.value })} /></div>
              <div><Label>État</Label><Input placeholder="Bon, moyen, à réparer..." value={f.etat} onChange={(e) => setF({ ...f, etat: e.target.value })} /></div>
              <div className="col-span-2"><Label>Observation</Label><Textarea value={f.observation} onChange={(e) => setF({ ...f, observation: e.target.value })} /></div>
              <div className="col-span-2"><Button type="submit" className="w-full">Enregistrer</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Marque/Modèle</TableHead><TableHead>Immat.</TableHead><TableHead>Année</TableHead><TableHead>Affectation</TableHead><TableHead>État</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun véhicule</TableCell></TableRow>
            : list.map((v) => <TableRow key={v.id}><TableCell className="font-medium">{v.marque} {v.modele ?? ""}</TableCell><TableCell>{v.immatriculation ?? "—"}</TableCell><TableCell>{v.annee ?? "—"}</TableCell><TableCell>{v.affectation ?? "—"}</TableCell><TableCell>{v.etat ?? "—"}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
