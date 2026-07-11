export type AuditAction =
  | "Nova inscrição"
  | "Edição"
  | "Exclusão"
  | "Aprovação"
  | "Recusa";

export interface AuditEntry {
  id: string;
  data: string; // ISO
  administrador: string;
  acao: AuditAction;
  nome_guerra?: string;
  matricula?: string;
  posto_graduacao?: string;
  secao?: string;
  competencia?: string; // "MM/YYYY"
  alteracoes?: { campo: string; de: any; para: any }[];
  snapshot?: any; // Full record snapshot (used on Exclusão)
}

const KEY = "auditoria";

export function logAudit(entry: Omit<AuditEntry, "id" | "data">) {
  const list: AuditEntry[] = JSON.parse(localStorage.getItem(KEY) || "[]");
  const rec: AuditEntry = {
    id: crypto.randomUUID(),
    data: new Date().toISOString(),
    ...entry,
  };
  list.push(rec);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAudit(): AuditEntry[] {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
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
