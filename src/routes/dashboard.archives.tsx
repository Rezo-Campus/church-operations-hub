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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Download, FileText } from "lucide-react";

export const Route = createFileRoute("/dashboard/archives")({ component: ArchivesPage });

interface Profile { id: string; full_name: string | null; email: string | null; }
interface ArchiveRow { id: string; numero_enregistrement: string; titre: string; description: string | null; file_path: string | null; file_name: string | null; sender_id: string; receiver_id: string; created_at: string; }

function ArchivesPage() {
  const { user, isAdminGeneral, roles } = useAuth();
  const allowed = !!user && (isAdminGeneral || roles.length > 0);
  const [list, setList] = useState<ArchiveRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [adminGeneralId, setAdminGeneralId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ titre: "", description: "", receiver_id: "", file: null as File | null });

  const load = async () => {
    const { data: profs } = await supabase.from("profiles").select("id, full_name, email");
    setProfiles((profs ?? []) as Profile[]);
    // find admin general
    const { data: ag } = await supabase.from("user_roles").select("user_id").eq("role", "admin_general").limit(1).maybeSingle();
    setAdminGeneralId(ag?.user_id ?? null);
    const { data } = await supabase.from("archives").select("*").order("created_at", { ascending: false });
    setList((data ?? []) as ArchiveRow[]);
  };
  useEffect(() => { if (allowed) load(); }, [allowed]);

  if (!allowed) return <Card><CardContent className="p-8 text-center text-muted-foreground">Accès refusé.</CardContent></Card>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.titre || !f.receiver_id) return toast.error("Titre et destinataire requis");
    let file_path: string | null = null;
    let file_name: string | null = null;
    if (f.file) {
      const path = `${user!.id}/${Date.now()}-${f.file.name}`;
      const { error: upErr } = await supabase.storage.from("archives").upload(path, f.file);
      if (upErr) return toast.error(upErr.message);
      file_path = path;
      file_name = f.file.name;
    }
    const { error } = await supabase.from("archives").insert({
      titre: f.titre, description: f.description || null,
      sender_id: user!.id, receiver_id: f.receiver_id,
      file_path, file_name,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Document archivé");
    setOpen(false);
    setF({ titre: "", description: "", receiver_id: "", file: null });
    load();
  };

  const download = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("archives").createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    const a = document.createElement("a"); a.href = data.signedUrl; a.download = name; a.click();
  };

  const nameOf = (id: string) => {
    const p = profiles.find((p) => p.id === id);
    return p?.full_name || p?.email || id.slice(0, 8);
  };

  // Pour les admins de service, on ne propose que l'admin général comme destinataire
  const possibleReceivers = isAdminGeneral
    ? profiles.filter((p) => p.id !== user!.id)
    : profiles.filter((p) => p.id === adminGeneralId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Archives — Documents internes</h1>
          <p className="text-sm text-muted-foreground">{isAdminGeneral ? "Vous voyez toutes les archives." : "Vous voyez uniquement vos échanges avec l'Admin Général."}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Nouveau document</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Archiver un document</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Titre *</Label><Input required value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} /></div>
              <div><Label>Destinataire *</Label>
                <Select value={f.receiver_id} onValueChange={(v) => setF({ ...f, receiver_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{possibleReceivers.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
              <div><Label>Fichier joint</Label><Input type="file" onChange={(e) => setF({ ...f, file: e.target.files?.[0] ?? null })} /></div>
              <Button type="submit" className="w-full">Archiver</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>N° d'enregistrement</TableHead><TableHead>Titre</TableHead><TableHead>De</TableHead><TableHead>À</TableHead><TableHead>Date</TableHead><TableHead>Fichier</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun document</TableCell></TableRow>
            : list.map((a) => <TableRow key={a.id}>
                <TableCell className="font-mono text-sm">{a.numero_enregistrement}</TableCell>
                <TableCell className="font-medium">{a.titre}</TableCell>
                <TableCell>{nameOf(a.sender_id)}</TableCell>
                <TableCell>{nameOf(a.receiver_id)}</TableCell>
                <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{a.file_path ? <Button size="sm" variant="ghost" onClick={() => download(a.file_path!, a.file_name!)}><Download className="h-4 w-4 mr-1" />{a.file_name}</Button> : <span className="text-muted-foreground"><FileText className="inline h-4 w-4 mr-1" />—</span>}</TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
