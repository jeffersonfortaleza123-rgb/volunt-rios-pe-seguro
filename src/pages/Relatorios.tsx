import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer, FileDown, FileSpreadsheet, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { postoRank } from "@/lib/postos";

interface Voluntario {
  nome: string;
  nome_guerra?: string;
  posto_graduacao?: string;
  matricula: string;
  email?: string;
  secao?: string;
  datasSelecionadas: string[];
  jaPreencheu: boolean;
  created_at: string;
}

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

  const voluntarios: Voluntario[] = useMemo(
    () => JSON.parse(localStorage.getItem("voluntarios") || "[]"),
    []
  );


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
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 8;
    const marginTop = 8;
    const marginBottom = 10;
    const emissao = new Date().toLocaleString("pt-BR");
    const titulo = `Corpo de Bombeiros Militar`;
    const subtitulo = `Escala de Voluntariado - ${secao}`;
    const competencia = `${MESES[mes]} / ${ano}`;

    const drawHeader = () => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(titulo, pageW / 2, marginTop + 2, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${subtitulo}  •  Competência: ${competencia}`, pageW / 2, marginTop + 7, { align: "center" });
    };

    drawHeader();
    let cursorY = marginTop + 11;

    diasOrdenados.forEach((dia) => {
      // Add space title for the day
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Dia ${dia}`, marginX, cursorY);
      cursorY += 1;

      autoTable(doc, {
        startY: cursorY,
        head: [["Posto/Graduação", "Matrícula", "Nome de Guerra"]],
        body: dadosPorDia[dia].map(v => [v.posto_graduacao, v.matricula, v.nome_guerra]),
        theme: "grid",
        headStyles: { fillColor: [163, 22, 33], fontSize: 8, cellPadding: 1 },
        bodyStyles: { fontSize: 8, cellPadding: 1 },
        styles: { overflow: "linebreak" },
        margin: { left: marginX, right: marginX, top: marginTop + 10, bottom: marginBottom },
        didDrawPage: () => drawHeader(),
      });
      // @ts-ignore
      cursorY = (doc as any).lastAutoTable.finalY + 3;

      if (cursorY > pageH - marginBottom - 15) {
        doc.addPage();
        drawHeader();
        cursorY = marginTop + 11;
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.text(`Emitido em ${emissao}`, marginX, pageH - 4);
      doc.text(`Página ${i} de ${pageCount}`, pageW - marginX, pageH - 4, { align: "right" });
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
            <h1 className="text-2xl font-bold text-fire-black">Relatórios por Seção</h1>
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

            <div id="print-area" className="bg-white rounded-lg shadow-lg border border-fire-red/20 p-6 print:shadow-none print:border-0 print:p-0">
              {/* Cabeçalho impressão */}
              <div className="text-center border-b border-fire-red/40 pb-3 mb-4">
                <h2 className="text-lg font-bold text-fire-black">Corpo de Bombeiros Militar</h2>
                <p className="text-sm text-muted-foreground">Escala de Serviço Extraordinário — Voluntariado</p>
                <p className="text-sm font-semibold text-fire-black mt-1">{secao}</p>
                <p className="text-sm text-fire-black">Competência: {MESES[mes]} / {ano}</p>
              </div>

              {diasOrdenados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flame className="h-10 w-10 text-fire-red mx-auto mb-2" />
                  Nenhum voluntário registrado para esta seção no período.
                </div>
              ) : (
                <div className="space-y-4">
                  {diasOrdenados.map((dia, idx) => (
                    <div key={dia} className={`day-block ${idx > 0 ? "day-break" : ""}`}>
                      <h3 className="font-bold text-fire-black mb-1">Dia {dia}</h3>
                      <table className="w-full text-sm border border-fire-red/30">
                        <thead>
                          <tr className="bg-fire-red text-white">
                            <th className="text-left px-2 py-1 border border-fire-red/30 w-[25%]">Matrícula</th>
                            <th className="text-left px-2 py-1 border border-fire-red/30 w-[35%]">Posto/Graduação</th>
                            <th className="text-left px-2 py-1 border border-fire-red/30">Nome de Guerra</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dadosPorDia[dia].map((v, i) => (
                            <tr key={i} className="odd:bg-fire-light/40">
                              <td className="px-2 py-1 border border-fire-red/30">{v.matricula}</td>
                              <td className="px-2 py-1 border border-fire-red/30">{v.posto_graduacao}</td>
                              <td className="px-2 py-1 border border-fire-red/30">{v.nome_guerra}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}


              <div className="text-xs text-muted-foreground mt-6 flex justify-between print:mt-4">
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
