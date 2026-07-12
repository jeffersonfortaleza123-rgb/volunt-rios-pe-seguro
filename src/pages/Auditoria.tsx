import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { isAdmin } from "@/lib/audit";
import { fetchAudit, AuditRow } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

const TIPOS = ["Todas", "Nova inscrição", "Edição", "Exclusão", "Período criado", "Período atualizado", "Período removido"];

const Auditoria = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<AuditRow[]>([]);
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("Todas");
  const [admin, setAdmin] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const load = async () => setEntries(await fetchAudit());

  useEffect(() => {
    if (!isAdmin()) { navigate("/"); return; }
    load();
    const ch = supabase.channel("audit-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "auditoria" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const admins = useMemo(
    () => Array.from(new Set(entries.map(e => e.administrador))).filter(Boolean),
    [entries]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return entries.filter(e => {
      if (tipo !== "Todas" && e.acao !== tipo) return false;
      if (admin && e.administrador !== admin) return false;
      if (de && new Date(e.data) < new Date(de)) return false;
      if (ate && new Date(e.data) > new Date(ate + "T23:59:59")) return false;
      if (!s) return true;
      return [e.nome_guerra, e.matricula, e.posto_graduacao, e.secao, e.competencia, e.administrador]
        .filter(Boolean).join(" ").toLowerCase().includes(s);
    });
  }, [entries, q, tipo, admin, de, ate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="mb-2 bg-fire-red text-primary-foreground border-fire-red shadow-fire">Auditoria</Badge>
            <h1 className="text-2xl font-bold text-fire-black">Histórico de Alterações</h1>
          </div>
          <Button asChild variant="outline" size="sm" className="border-fire-red text-fire-red hover:bg-fire-red hover:text-white">
            <Link to="/escalante"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link>
          </Button>
        </div>

        <Card className="shadow-lg border-fire-red/20">
          <CardHeader>
            <CardTitle className="text-fire-black">Filtros</CardTitle>
            <CardDescription>Refine a busca no histórico.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1"><Label>Pesquisa</Label><Input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, matrícula..." /></div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Administrador</Label>
              <Select value={admin || "todos"} onValueChange={v => setAdmin(v === "todos" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {admins.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>De</Label><Input type="date" value={de} onChange={e => setDe(e.target.value)} /></div>
            <div className="space-y-1"><Label>Até</Label><Input type="date" value={ate} onChange={e => setAte(e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-fire-red/20">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fire-red text-white">
                  <th className="text-left px-2 py-1">Data/Hora</th>
                  <th className="text-left px-2 py-1">Administrador</th>
                  <th className="text-left px-2 py-1">Ação</th>
                  <th className="text-left px-2 py-1">Posto/Grad.</th>
                  <th className="text-left px-2 py-1">Matrícula</th>
                  <th className="text-left px-2 py-1">Nome de Guerra</th>
                  <th className="text-left px-2 py-1">Seção</th>
                  <th className="text-left px-2 py-1">Competência</th>
                  <th className="text-left px-2 py-1">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-6 text-muted-foreground">Nenhum registro.</td></tr>
                )}
                {filtered.map((e) => (
                  <tr key={e.id} className="odd:bg-fire-light/40 border-t border-fire-red/20 align-top">
                    <td className="px-2 py-1 whitespace-nowrap">{new Date(e.data).toLocaleString("pt-BR")}</td>
                    <td className="px-2 py-1">{e.administrador}</td>
                    <td className="px-2 py-1">{e.acao}</td>
                    <td className="px-2 py-1">{e.posto_graduacao}</td>
                    <td className="px-2 py-1">{e.matricula}</td>
                    <td className="px-2 py-1">{e.nome_guerra}</td>
                    <td className="px-2 py-1">{e.secao}</td>
                    <td className="px-2 py-1">{e.competencia}</td>
                    <td className="px-2 py-1 text-xs">
                      {Array.isArray(e.alteracoes) && e.alteracoes.length ? (
                        <ul className="list-disc ml-4">
                          {e.alteracoes.map((a: any, i: number) => (
                            <li key={i}><b>{a.campo}:</b> {String(a.de)} → {String(a.para)}</li>
                          ))}
                        </ul>
                      ) : e.snapshot ? (
                        <div className="text-muted-foreground">
                          {e.snapshot.email && <div>E-mail: {e.snapshot.email}</div>}
                          {e.snapshot.datasSelecionadas && (
                            <div>Dias: {(e.snapshot.datasSelecionadas || []).map((d: string) => new Date(d).toLocaleDateString("pt-BR")).join(", ")}</div>
                          )}
                          {e.snapshot.data_inicio && (
                            <div>Período: {e.snapshot.data_inicio} → {e.snapshot.data_fim}</div>
                          )}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auditoria;
