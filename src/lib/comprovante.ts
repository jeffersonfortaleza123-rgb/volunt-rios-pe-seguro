import jsPDF from "jspdf";
import { Voluntario } from "@/lib/db";

const fmtData = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");

export function gerarComprovantePDF(v: Voluntario) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 20; // margem
  let y = 22;

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("CORPO DE BOMBEIROS MILITAR DE PERNAMBUCO", W / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(12);
  doc.text("3º GRUPAMENTO BOMBEIRO", W / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(14);
  doc.setTextColor(180, 30, 30);
  doc.text("COMPROVANTE DE INSCRIÇÃO — VOLUNTARIADO PE SEGURO", W / 2, y, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y += 6;
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 10;

  // Dados do militar
  doc.setFontSize(11);
  const linha = (rotulo: string, valor: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(rotulo, M, y);
    doc.setFont("helvetica", "normal");
    doc.text(valor || "—", M + 48, y);
    y += 8;
  };

  const protocolo = (v.id || "").replace(/-/g, "").slice(0, 8).toUpperCase() || "—";
  linha("Protocolo:", protocolo);
  linha("Posto/Graduação:", v.posto_graduacao || "—");
  linha("Nome de Guerra:", (v.nome_guerra || "").toUpperCase());
  linha("Nome Completo:", v.nome);
  linha("Matrícula:", v.matricula);
  linha("Seção:", v.secao || "—");
  linha("Inscrição feita em:", new Date(v.created_at).toLocaleString("pt-BR"));
  y += 4;

  // Datas selecionadas
  doc.setFont("helvetica", "bold");
  doc.text(`Dias de voluntariado selecionados (${v.datasSelecionadas.length}):`, M, y);
  y += 8;
  doc.setFont("helvetica", "normal");

  const datas = [...v.datasSelecionadas].sort().map(fmtData);
  const porLinha = 4;
  for (let i = 0; i < datas.length; i += porLinha) {
    doc.text(datas.slice(i, i + porLinha).join("     "), M + 4, y);
    y += 7;
    if (y > 265) { doc.addPage(); y = 22; }
  }

  y += 6;
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Documento gerado eletronicamente pelo Sistema de Voluntariado PE Seguro em ${new Date().toLocaleString("pt-BR")}.`,
    W / 2, y, { align: "center" }
  );
  y += 5;
  doc.text("Confirmação sujeita à validação pelo Escalante do 3º GB.", W / 2, y, { align: "center" });

  const ng = (v.nome_guerra || "militar").toUpperCase().replace(/[^A-Z0-9]/g, "");
  doc.save(`comprovante-pe-seguro-${ng}-${protocolo}.pdf`);
}
