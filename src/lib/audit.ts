import { insertAudit } from "./db";

export type AuditAction =
  | "Nova inscrição"
  | "Edição"
  | "Exclusão"
  | "Aprovação"
  | "Recusa"
  | "Período criado"
  | "Período atualizado"
  | "Período removido";

export interface AuditEntry {
  id: string;
  data: string;
  administrador: string;
  acao: AuditAction | string;
  nome_guerra?: string;
  matricula?: string;
  posto_graduacao?: string;
  secao?: string;
  competencia?: string;
  alteracoes?: { campo: string; de: any; para: any }[];
  snapshot?: any;
}

export async function logAudit(entry: Omit<AuditEntry, "id" | "data">) {
  await insertAudit({
    administrador: entry.administrador,
    acao: entry.acao,
    nome_guerra: entry.nome_guerra,
    matricula: entry.matricula,
    posto_graduacao: entry.posto_graduacao,
    secao: entry.secao,
    competencia: entry.competencia,
    alteracoes: entry.alteracoes,
    snapshot: entry.snapshot,
  });
}

export function competenciaFromDates(dates: string[]): string {
  if (!dates?.length) return "";
  const d = new Date(dates[0]);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function isAdmin(): boolean {
  return sessionStorage.getItem("escalanteAuth") === "1";
}

export function currentAdmin(): string {
  return sessionStorage.getItem("escalanteNome") || "Escalante";
}
