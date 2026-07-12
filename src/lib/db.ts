import { supabase } from "@/integrations/supabase/client";

export interface Voluntario {
  id?: string;
  nome: string;
  nome_guerra?: string | null;
  posto_graduacao?: string | null;
  matricula: string;
  email?: string | null;
  secao?: string | null;
  datasSelecionadas: string[];
  jaPreencheu?: boolean;
  created_at: string;
}

export interface Periodo {
  id?: string;
  competencia: string; // "MM/YYYY"
  data_inicio: string; // "YYYY-MM-DD"
  data_fim: string; // "YYYY-MM-DD"
  aberto_manual: boolean | null;
  created_at?: string;
  updated_at?: string;
}

const rowToVol = (r: any): Voluntario => ({
  id: r.id,
  nome: r.nome,
  nome_guerra: r.nome_guerra,
  posto_graduacao: r.posto_graduacao,
  matricula: r.matricula,
  email: r.email,
  secao: r.secao,
  datasSelecionadas: r.datas_selecionadas || [],
  jaPreencheu: true,
  created_at: r.created_at,
});

export async function fetchVoluntarios(): Promise<Voluntario[]> {
  const { data, error } = await supabase
    .from("voluntarios")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToVol);
}

export async function insertVoluntario(v: Omit<Voluntario, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("voluntarios")
    .insert({
      nome: v.nome,
      nome_guerra: v.nome_guerra || null,
      posto_graduacao: v.posto_graduacao || null,
      matricula: v.matricula,
      email: v.email || null,
      secao: v.secao || null,
      datas_selecionadas: v.datasSelecionadas,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToVol(data);
}

export async function deleteVoluntario(id: string) {
  const { error } = await supabase.from("voluntarios").delete().eq("id", id);
  if (error) throw error;
}

// Audit
export interface AuditRow {
  id: string;
  data: string;
  administrador: string;
  acao: string;
  nome_guerra?: string | null;
  matricula?: string | null;
  posto_graduacao?: string | null;
  secao?: string | null;
  competencia?: string | null;
  alteracoes?: any;
  snapshot?: any;
}

export async function fetchAudit(): Promise<AuditRow[]> {
  const { data, error } = await supabase
    .from("auditoria")
    .select("*")
    .order("data", { ascending: false });
  if (error) throw error;
  return (data || []) as AuditRow[];
}

export async function insertAudit(entry: Omit<AuditRow, "id" | "data"> & { data?: string }) {
  const { error } = await supabase.from("auditoria").insert({
    administrador: entry.administrador,
    acao: entry.acao,
    nome_guerra: entry.nome_guerra ?? null,
    matricula: entry.matricula ?? null,
    posto_graduacao: entry.posto_graduacao ?? null,
    secao: entry.secao ?? null,
    competencia: entry.competencia ?? null,
    alteracoes: entry.alteracoes ?? null,
    snapshot: entry.snapshot ?? null,
  });
  if (error) console.error("audit insert error", error);
}

// Periodos
export async function fetchPeriodos(): Promise<Periodo[]> {
  const { data, error } = await supabase
    .from("periodos_inscricao")
    .select("*")
    .order("competencia", { ascending: false });
  if (error) throw error;
  return (data || []) as Periodo[];
}

export async function fetchPeriodoByCompetencia(competencia: string): Promise<Periodo | null> {
  const { data, error } = await supabase
    .from("periodos_inscricao")
    .select("*")
    .eq("competencia", competencia)
    .maybeSingle();
  if (error) throw error;
  return (data as Periodo) || null;
}

export async function upsertPeriodo(p: Omit<Periodo, "id" | "created_at" | "updated_at">) {
  const { error } = await supabase
    .from("periodos_inscricao")
    .upsert(
      {
        competencia: p.competencia,
        data_inicio: p.data_inicio,
        data_fim: p.data_fim,
        aberto_manual: p.aberto_manual,
      },
      { onConflict: "competencia" }
    );
  if (error) throw error;
}

export async function deletePeriodo(id: string) {
  const { error } = await supabase.from("periodos_inscricao").delete().eq("id", id);
  if (error) throw error;
}

export function periodoAberto(p: Periodo | null): boolean {
  if (!p) return false;
  if (p.aberto_manual === true) return true;
  if (p.aberto_manual === false) return false;
  const now = new Date();
  const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ini = new Date(p.data_inicio + "T00:00:00");
  const fim = new Date(p.data_fim + "T23:59:59");
  return hoje >= ini && now <= fim;
}
