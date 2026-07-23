import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAdmin, currentAdmin, logAudit, competenciaFromDates } from "@/lib/audit";
import { postoRank } from "@/lib/postos";
import { fetchVoluntarios, deleteVoluntario, Voluntario } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

const Inscricoes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<Voluntario[]>([]);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Voluntario | null>(null);
  const [toDelete, setToDelete] = useState<Voluntario | null>(null);

  const load = async () => {
    try { setItems(await fetchVoluntarios()); }
    catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  };

  useEffect(() => {
    if (!isAdmin()) { navigate("/"); return; }
    load();
    const ch = supabase.channel("insc-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "voluntarios" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = [...items].sort((a, b) => {
      const r = postoRank(a.posto_graduacao || "") - postoRank(b.posto_graduacao || "");
      if (r !== 0) return r;
      return (a.matricula || "").localeCompare(b.matricula || "", "pt-BR", { numeric: true });
    });
    if (!s) return base;
    return base.filter(v =>
      [v.nome, v.nome_guerra, v.matricula, v.posto_graduacao, v.secao, v.email]
        .filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [items, q]);

  const confirmDelete = async () => {
    if (!toDelete?.id) return;
    try {
      await deleteVoluntario(toDelete.id);
      await logAudit({
        administrador: currentAdmin(),
        acao: "Exclusão",
        nome_guerra: toDelete.nome_guerra || undefined,
        matricula: toDelete.matricula,
        posto_graduacao: toDelete.posto_graduacao || undefined,
        secao: toDelete.secao || undefined,
        competencia: competenciaFromDates(toDelete.datasSelecionadas),
        snapshot: toDelete,
      });
      toast({ title: "Inscrição excluída", description: `${toDelete.nome_guerra || toDelete.nome} removido.` });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setToDelete(null);
      setDetail(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="mb-2 bg-fire-red text-primary-foreground border-fire-red shadow-fire">Inscrições</Badge>
            <h1 className="text-2xl font-bold text-gradient-fire">Gerenciar Inscrições</h1>
          </div>
          <Button asChild variant="outline" size="sm" className="border-fire-red text-fire-red hover:bg-fire-red hover:text-white">
            <Link to="/escalante"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link>
          </Button>
        </div>

        <Card className="shadow-lg border-fire-red/20">
          <CardHeader>
            <CardTitle className="text-fire-black">Lista de Inscrições</CardTitle>
            <CardDescription>Pesquise, visualize ou exclua inscrições.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Pesquisar por nome, matrícula, seção..." value={q} onChange={e => setQ(e.target.value)} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-fire-red/30">
                <thead>
                  <tr className="bg-fire-red text-white">
                    <th className="text-left px-2 py-1">Posto/Graduação</th>
                    <th className="text-left px-2 py-1">Matrícula</th>
                    <th className="text-left px-2 py-1">Nome de Guerra</th>
                    <th className="text-left px-2 py-1">Seção</th>
                    <th className="text-left px-2 py-1">Dias</th>
                    <th className="text-right px-2 py-1">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">Nenhuma inscrição.</td></tr>
                  )}
                  {filtered.map((v) => (
                    <tr key={v.id} className="odd:bg-fire-light/40 border-t border-fire-red/20">
                      <td className="px-2 py-1">{v.posto_graduacao}</td>
                      <td className="px-2 py-1">{v.matricula}</td>
                      <td className="px-2 py-1">{v.nome_guerra || v.nome}</td>
                      <td className="px-2 py-1">{v.secao}</td>
                      <td className="px-2 py-1">{v.datasSelecionadas.length}</td>
                      <td className="px-2 py-1 text-right">
                        <Button size="sm" variant="outline" className="mr-2" onClick={() => setDetail(v)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setToDelete(v)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Detalhes da Inscrição</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {detail ? (
                <div className="text-left space-y-1 text-sm">
                  <div><b>Nome:</b> {detail.nome}</div>
                  <div><b>Nome de Guerra:</b> {detail.nome_guerra}</div>
                  <div><b>Posto/Graduação:</b> {detail.posto_graduacao}</div>
                  <div><b>Matrícula:</b> {detail.matricula}</div>
                  <div><b>E-mail:</b> {detail.email}</div>
                  <div><b>Seção:</b> {detail.secao}</div>
                  <div><b>Dias:</b> {detail.datasSelecionadas.map(d => new Date(d).toLocaleDateString("pt-BR")).join(", ")}</div>
                  <div><b>Enviado em:</b> {new Date(detail.created_at).toLocaleString("pt-BR")}</div>
                </div>
              ) : <span />}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => detail && setToDelete(detail)}>
              <Trash2 className="h-4 w-4 mr-2" />Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir inscrição?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta inscrição? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inscricoes;
