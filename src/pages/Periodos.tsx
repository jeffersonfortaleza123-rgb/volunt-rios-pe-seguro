import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, CalendarDays, Trash2, Lock, Unlock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAdmin, currentAdmin, logAudit } from "@/lib/audit";
import { fetchPeriodos, upsertPeriodo, deletePeriodo, Periodo, periodoAberto } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const Periodos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<Periodo[]>([]);
  const now = new Date();
  const [mes, setMes] = useState<number>(now.getMonth());
  const [ano, setAno] = useState<number>(now.getFullYear());
  const [ini, setIni] = useState("");
  const [fim, setFim] = useState("");
  const [toDelete, setToDelete] = useState<Periodo | null>(null);

  const load = async () => {
    try {
      setItems(await fetchPeriodos());
    } catch (e: any) {
      toast({ title: "Erro ao carregar", description: e.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!isAdmin()) { navigate("/"); return; }
    load();
    const ch = supabase
      .channel("periodos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "periodos_inscricao" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salvar = async () => {
    if (!ini || !fim) {
      toast({ title: "Preencha as datas", variant: "destructive" });
      return;
    }
    if (fim < ini) {
      toast({ title: "Data final deve ser após a inicial", variant: "destructive" });
      return;
    }
    const comp = `${String(mes + 1).padStart(2, "0")}/${ano}`;
    try {
      const existed = items.find(p => p.competencia === comp);
      await upsertPeriodo({ competencia: comp, data_inicio: ini, data_fim: fim, aberto_manual: null });
      await logAudit({
        administrador: currentAdmin(),
        acao: existed ? "Período atualizado" : "Período criado",
        competencia: comp,
        snapshot: { data_inicio: ini, data_fim: fim },
      });
      toast({ title: "Período salvo", description: `${comp} de ${ini} até ${fim}.` });
      setIni(""); setFim("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const toggleManual = async (p: Periodo, aberto: boolean | null) => {
    try {
      await upsertPeriodo({
        competencia: p.competencia,
        data_inicio: p.data_inicio,
        data_fim: p.data_fim,
        aberto_manual: aberto,
      });
      await logAudit({
        administrador: currentAdmin(),
        acao: "Período atualizado",
        competencia: p.competencia,
        alteracoes: [{ campo: "aberto_manual", de: p.aberto_manual, para: aberto }],
      });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deletePeriodo(toDelete.id!);
      await logAudit({
        administrador: currentAdmin(),
        acao: "Período removido",
        competencia: toDelete.competencia,
        snapshot: toDelete,
      });
      toast({ title: "Período removido" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setToDelete(null);
    }
  };

  const anos = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 1 + i);
  const statusLabel = (p: Periodo) => {
    if (p.aberto_manual === true) return "Aberto (manual)";
    if (p.aberto_manual === false) return "Encerrado (manual)";
    return periodoAberto(p) ? "Aberto (automático)" : "Encerrado (automático)";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="mb-2 bg-fire-red text-primary-foreground border-fire-red shadow-fire">Período</Badge>
            <h1 className="text-2xl font-bold text-fire-black">Período de Inscrições</h1>
          </div>
          <Button asChild variant="outline" size="sm" className="border-fire-red text-fire-red hover:bg-fire-red hover:text-white">
            <Link to="/escalante"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link>
          </Button>
        </div>

        <Card className="shadow-lg border-fire-red/20">
          <CardHeader>
            <CardTitle className="text-fire-black flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-fire-red" />
              Configurar competência
            </CardTitle>
            <CardDescription>Defina o período de abertura e encerramento das inscrições.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label>Mês</Label>
              <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MESES.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Ano</Label>
              <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Início</Label>
              <Input type="date" value={ini} onChange={e => setIni(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Encerramento</Label>
              <Input type="date" value={fim} onChange={e => setFim(e.target.value)} />
            </div>
            <Button onClick={salvar} className="bg-fire-red hover:bg-fire-red-dark">Salvar</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-fire-red/20">
          <CardHeader>
            <CardTitle className="text-fire-black">Períodos cadastrados</CardTitle>
            <CardDescription>Você pode abrir ou encerrar manualmente cada competência.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm border border-fire-red/30">
              <thead>
                <tr className="bg-fire-red text-white">
                  <th className="text-left px-2 py-1">Competência</th>
                  <th className="text-left px-2 py-1">Início</th>
                  <th className="text-left px-2 py-1">Encerramento</th>
                  <th className="text-left px-2 py-1">Status</th>
                  <th className="text-right px-2 py-1">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">Nenhum período cadastrado.</td></tr>
                )}
                {items.map(p => (
                  <tr key={p.id} className="odd:bg-fire-light/40 border-t border-fire-red/20">
                    <td className="px-2 py-1 font-semibold">{p.competencia}</td>
                    <td className="px-2 py-1">{new Date(p.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                    <td className="px-2 py-1">{new Date(p.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                    <td className="px-2 py-1">{statusLabel(p)}</td>
                    <td className="px-2 py-1 text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => toggleManual(p, true)} title="Abrir manualmente">
                        <Unlock className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleManual(p, false)} title="Encerrar manualmente">
                        <Lock className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleManual(p, null)} title="Voltar para automático">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setToDelete(p)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover período?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não poderá ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={confirmDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Periodos;
