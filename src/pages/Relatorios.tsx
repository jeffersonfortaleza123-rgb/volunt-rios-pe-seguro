import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer, FileDown, FileSpreadsheet, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

import * as XLSX from "xlsx";
import { postoRank } from "@/lib/postos";
import { fetchVoluntarios, Voluntario } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

const SECOES = ["Primeira Seção", "Segunda Seção", "Terceira Seção", "Quarta Seção"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const Relatorios = () => {
  const now = new Date();
  const [mes, setMes] = useState<number>(now.getMonth());
  const [ano, setAno] = useState<number>(now.getFullYear());
  const [secao, setSecao] = useState<string>("");
  const [diaFiltro, setDiaFiltro] = useState<string>("todos");
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);

  useEffect(() => {
    const load = async () => {
      try { setVoluntarios(await fetchVoluntarios()); } catch (e) { console.error(e); }
    };
    load();
    const ch = supabase.channel("rel-vol-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "voluntarios" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);



  const anos = useMemo(() => {
    const set = new Set<number>([now.getFullYear()]);
    voluntarios.forEach(v => v.datasSelecionadas.forEach(d => set.add(new Date(d).getFullYear())));
    return Array.from(set).sort((a, b) => b - a);
  }, [voluntarios]);

  // { "01": [{ matricula, posto_graduacao, nome_guerra }, ...], ... }
  type Linha = { matricula: string; posto_graduacao: string; nome_guerra: string };
  const dadosPorDia = useMemo(() => {
    if (!secao) return {} as Record<string, Linha[]>;
    const map: Record<string, Linha[]> = {};
    voluntarios
      .filter(v => (v.secao || "") === secao)
      .forEach(v => {
        v.datasSelecionadas.forEach(dataStr => {
          const d = new Date(dataStr);
          if (d.getMonth() !== mes || d.getFullYear() !== ano) return;
          const dia = d.getDate().toString().padStart(2, "0");
          if (!map[dia]) map[dia] = [];
          map[dia].push({
            matricula: v.matricula,
            posto_graduacao: v.posto_graduacao || "",
            nome_guerra: v.nome_guerra || v.nome,
          });
        });
      });
    // ordenar por hierarquia (mais alto → mais baixo) e depois nome de guerra
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => {
        const r = postoRank(a.posto_graduacao) - postoRank(b.posto_graduacao);
        if (r !== 0) return r;
        return a.matricula.localeCompare(b.matricula, "pt-BR", { numeric: true });
      });
    });
    return map;
  }, [voluntarios, mes, ano, secao]);

  const diasOrdenados = useMemo(() => {
    const todos = Object.keys(dadosPorDia).sort((a, b) => Number(a) - Number(b));
    return diaFiltro === "todos" ? todos : todos.filter(d => d === diaFiltro);
  }, [dadosPorDia, diaFiltro]);

  const diasDisponiveis = useMemo(
    () => Object.keys(dadosPorDia).sort((a, b) => Number(a) - Number(b)),
    [dadosPorDia]
  );


  const handlePrint = () => window.print();

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210, pageH = 297;
    const mx = 8, my = 8;
    const cols = 3, gap = 3;
    const cardW = (pageW - mx * 2 - gap * (cols - 1)) / cols;
    const mesUpper = MESES[mes].toUpperCase();

    const drawTitle = () => {
      doc.setFont("helvetica", "bold").setFontSize(11);
      doc.text("Corpo de Bombeiros Militar", pageW / 2, my + 3, { align: "center" });
      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.text(`Escala de Voluntariado — ${secao} • ${MESES[mes]}/${ano}`, pageW / 2, my + 7, { align: "center" });
    };

    const startY = my + 11;
    const colX = Array.from({ length: cols }, (_, i) => mx + i * (cardW + gap));
    const colY = Array(cols).fill(startY);

    drawTitle();

    const rowH = 3.2, headerH = 4.5, colHdrH = 3.6, padY = 1.2;

    diasOrdenados.forEach((dia) => {
      const rows = dadosPorDia[dia];
      const cardH = headerH + colHdrH + rows.length * rowH + padY;

      let ci = 0;
      for (let i = 1; i < cols; i++) if (colY[i] < colY[ci]) ci = i;

      if (colY[ci] + cardH > pageH - my) {
        doc.addPage();
        drawTitle();
        colY.fill(startY);
        ci = 0;
      }

      const x = colX[ci], y = colY[ci];
      doc.setDrawColor(163, 22, 33).setLineWidth(0.2);
      doc.rect(x, y, cardW, cardH);
      doc.setFillColor(163, 22, 33);
      doc.rect(x, y, cardW, headerH, "F");
      doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(7);
      doc.text(`DIA ${dia} - ${mesUpper}/${ano}`, x + cardW / 2, y + headerH - 1.4, { align: "center" });

      doc.setTextColor(0, 0, 0).setFontSize(6).setFont("helvetica", "bold");
      const c1 = x + 1, c2 = x + cardW * 0.48, c3 = x + cardW * 0.7;
      let ry = y + headerH + colHdrH - 0.7;
      doc.text("Posto/Grad.", c1, ry);
      doc.text("Matrícula", c2, ry);
      doc.text("Nome Guerra", c3, ry);
      doc.setDrawColor(163, 22, 33).setLineWidth(0.1);
      doc.line(x, ry + 0.6, x + cardW, ry + 0.6);
      ry += rowH;
      doc.setFont("helvetica", "normal");
      rows.forEach((v) => {
        doc.text(String(v.posto_graduacao).slice(0, 16), c1, ry);
        doc.text(v.matricula, c2, ry);
        doc.text(String(v.nome_guerra).slice(0, 14), c3, ry);
        ry += rowH;
      });

      colY[ci] = y + cardH + gap;
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(6).setTextColor(0, 0, 0);
      doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, mx, pageH - 3);
      doc.text(`Página ${i}/${pageCount}`, pageW - mx, pageH - 3, { align: "right" });
    }

    doc.save(`relatorio-${secao}-${MESES[mes]}-${ano}.pdf`);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    diasOrdenados.forEach(dia => {
      const rows: (string | number)[][] = [
        ["Corpo de Bombeiros Militar"],
        [`Escala de Voluntariado - ${secao}`],
        [`Competência: ${MESES[mes]} / ${ano}`],
        [`Dia ${dia}`],
        [],
        ["Matrícula", "Posto/Graduação", "Nome de Guerra"],
      ];
      dadosPorDia[dia].forEach(v => rows.push([v.matricula, v.posto_graduacao, v.nome_guerra]));
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `Dia ${dia}`);
    });
    if (diasOrdenados.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([["Sem registros"]]);
      XLSX.utils.book_append_sheet(wb, ws, "Vazio");
    }
    const sufixo = diaFiltro === "todos" ? "" : `-dia-${diaFiltro}`;
    XLSX.writeFile(wb, `relatorio-${secao}-${MESES[mes]}-${ano}${sufixo}.xlsx`);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray p-4">
      <div className="max-w-4xl mx-auto space-y-6 print:max-w-full">
        {/* Header (hidden on print) */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            <Badge variant="outline" className="mb-2 bg-fire-red text-primary-foreground border-fire-red shadow-fire">
              📋 Relatórios
            </Badge>
            <h1 className="text-2xl font-bold text-gradient-fire">Relatórios por Seção</h1>
            <p className="text-muted-foreground">Selecione a competência e a seção</p>
          </div>
          <Button asChild variant="outline" size="sm" className="border-fire-red text-fire-red hover:bg-fire-red hover:text-white">
            <Link to="/escalante"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link>
          </Button>
        </div>

        {/* Filtros */}
        <Card className="shadow-lg border-fire-red/20 print:hidden">
          <CardHeader>
            <CardTitle className="text-fire-black">Competência</CardTitle>
            <CardDescription>Escolha o mês e ano para gerar o relatório</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select value={String(mes)} onValueChange={v => { setMes(Number(v)); setDiaFiltro("todos"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={String(ano)} onValueChange={v => { setAno(Number(v)); setDiaFiltro("todos"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dia</Label>
              <Select value={diaFiltro} onValueChange={setDiaFiltro} disabled={!secao || diasDisponiveis.length === 0}>
                <SelectTrigger><SelectValue placeholder="Todos os dias" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os dias</SelectItem>
                  {diasDisponiveis.map(d => <SelectItem key={d} value={d}>Dia {d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>

        </Card>

        {/* Seções */}
        <Card className="shadow-lg border-fire-red/20 print:hidden">
          <CardHeader>
            <CardTitle className="text-fire-black">Seção</CardTitle>
            <CardDescription>Clique para gerar o relatório</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SECOES.map(s => (
              <Button
                key={s}
                onClick={() => setSecao(s)}
                variant={secao === s ? "default" : "outline"}
                className={secao === s
                  ? "bg-fire-red hover:bg-fire-red-dark text-white"
                  : "border-fire-red text-fire-red hover:bg-fire-red hover:text-white"}
              >
                {s}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Relatório */}
        {secao && (
          <>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button onClick={handlePrint} className="bg-fire-red hover:bg-fire-red-dark">
                <Printer className="h-4 w-4 mr-2" />Imprimir Relatório
              </Button>
              <Button onClick={handleExportPDF} variant="outline" className="border-fire-red text-fire-red hover:bg-fire-red hover:text-white">
                <FileDown className="h-4 w-4 mr-2" />Exportar PDF
              </Button>
              <Button onClick={handleExportExcel} variant="outline" className="border-fire-red text-fire-red hover:bg-fire-red hover:text-white">
                <FileSpreadsheet className="h-4 w-4 mr-2" />Exportar Excel
              </Button>
            </div>

            <div id="print-area" className="bg-white rounded-lg shadow-lg border border-fire-red/20 p-6 print:shadow-none print:border-0 print:p-0 print:[&_*]:!bg-white print:[&_*]:!text-black">
              {/* Cabeçalho impressão */}
              <div className="text-center border-b border-fire-red/40 pb-3 mb-4">
                <h2 className="text-lg font-bold text-fire-black print:!text-black">Corpo de Bombeiros Militar</h2>
                <p className="text-sm text-muted-foreground print:!text-black">Escala de Serviço Extraordinário — Voluntariado</p>
                <p className="text-sm font-semibold text-fire-black mt-1 print:!text-black">{secao}</p>
                <p className="text-sm print:!text-black">Competência: {MESES[mes]} / {ano}</p>
              </div>

              {diasOrdenados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flame className="h-10 w-10 text-fire-red mx-auto mb-2" />
                  Nenhum voluntário registrado para esta seção no período.
                </div>
              ) : (
                <div className="report-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {diasOrdenados.map((dia) => (
                    <div key={dia} className="day-card border border-fire-red/40 rounded-md overflow-hidden bg-white">
                      <div className="bg-fire-red text-white text-center font-bold py-1 text-[11px] leading-tight print:!bg-gray-200 print:!text-black">
                        DIA {dia} - {MESES[mes].toUpperCase()}/{ano}
                      </div>
                      <table className="w-full text-[10px] leading-tight">
                        <thead>
                          <tr className="bg-fire-light text-fire-black print:!bg-gray-100 print:!text-black">
                            <th className="text-left px-1 py-0.5 border-b border-fire-red/30">Posto/Grad.</th>
                            <th className="text-left px-1 py-0.5 border-b border-fire-red/30">Matrícula</th>
                            <th className="text-left px-1 py-0.5 border-b border-fire-red/30">Nome Guerra</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dadosPorDia[dia].map((v, i) => (
                            <tr key={i} className="odd:bg-fire-light/30 print:odd:!bg-white">
                              <td className="px-1 py-0.5 border-b border-fire-red/10 whitespace-nowrap print:!text-black print:!bg-white">{v.posto_graduacao}</td>
                              <td className="px-1 py-0.5 border-b border-fire-red/10 whitespace-nowrap print:!text-black print:!bg-white">{v.matricula}</td>
                              <td className="px-1 py-0.5 border-b border-fire-red/10 whitespace-nowrap print:!text-black print:!bg-white">{v.nome_guerra}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}


              <div className="text-xs text-muted-foreground mt-6 flex justify-between print:mt-4 print:!text-black">
                <span>Emitido em: {new Date().toLocaleString("pt-BR")}</span>
                <span className="print-page-number" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Relatorios;
