import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileDown, Search, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchVoluntarios, Voluntario } from "@/lib/db";
import { gerarComprovantePDF } from "@/lib/comprovante";
import brasao from "@/assets/brasao-3gb.png";

const Comprovante = () => {
  const [matricula, setMatricula] = useState("");
  const [nomeGuerra, setNomeGuerra] = useState("");
  const [resultados, setResultados] = useState<Voluntario[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const maskMatricula = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 7);
    return d.length <= 6 ? d : `${d.slice(0, 6)}-${d.slice(6)}`;
  };

  const competenciaDe = (v: Voluntario) => {
    const d = (v.datasSelecionadas || [])[0];
    if (!d) return "—";
    const dt = new Date(d + "T00:00:00");
    return `${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
  };

  const handleBuscar = async () => {
    const mat = matricula.trim();
    const ng = nomeGuerra.trim().toUpperCase();
    if (!/^\d{6}-\d$/.test(mat) || !ng) {
      toast({
        title: "Dados incompletos",
        description: "Informe a matrícula no formato 000000-0 e o nome de guerra.",
        variant: "destructive",
      });
      return;
    }
    setBuscando(true);
    try {
      const all = await fetchVoluntarios();
      const meus = all.filter(
        (v) =>
          (v.matricula || "").trim() === mat &&
          (v.nome_guerra || "").trim().toUpperCase() === ng
      );
      setResultados(meus);
      if (meus.length === 0) {
        toast({
          title: "Nenhuma inscrição encontrada",
          description: "Confira se a matrícula e o nome de guerra estão iguais aos usados na inscrição.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Erro ao buscar inscrições.", variant: "destructive" });
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-xl border-fire-red/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={brasao} alt="Brasão 3º GB" className="w-20 h-20 object-contain" />
            </div>
            <Badge variant="outline" className="mx-auto mb-2 bg-fire-red text-primary-foreground border-fire-red shadow-fire">
              🔥 Voluntariado PE Seguro
            </Badge>
            <CardTitle className="text-foreground text-xl">Comprovante de Inscrição</CardTitle>
            <CardDescription>
              Informe seus dados para baixar o comprovante em PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matricula" className="text-foreground font-medium">Matrícula</Label>
              <Input
                id="matricula"
                value={matricula}
                onChange={(e) => setMatricula(maskMatricula(e.target.value))}
                placeholder="000000-0"
                inputMode="numeric"
                maxLength={8}
                className="border-fire-red/30 focus:border-fire-red"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeGuerra" className="text-foreground font-medium">Nome de Guerra</Label>
              <Input
                id="nomeGuerra"
                value={nomeGuerra}
                onChange={(e) => setNomeGuerra(e.target.value)}
                placeholder="Ex.: SILVA"
                className="border-fire-red/30 focus:border-fire-red"
              />
            </div>
            <Button
              onClick={handleBuscar}
              disabled={buscando}
              className="w-full bg-fire-red hover:bg-fire-red-dark shadow-fire"
            >
              <Search className="mr-2 h-4 w-4" />
              {buscando ? "Buscando..." : "Buscar Inscrições"}
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full border-fire-red text-fire-red hover:bg-fire-red hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </CardContent>
        </Card>

        {resultados && resultados.length > 0 && (
          <Card className="shadow-xl border-fire-red/20">
            <CardHeader>
              <CardTitle className="text-foreground text-base">
                {resultados.length === 1 ? "Inscrição encontrada" : `${resultados.length} inscrições encontradas`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resultados.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-3 border border-fire-red/20 rounded-lg p-3"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">Competência {competenciaDe(v)}</p>
                    <p className="text-muted-foreground">
                      {v.secao || "Seção não informada"} · {v.datasSelecionadas.length}{" "}
                      {v.datasSelecionadas.length === 1 ? "dia" : "dias"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => gerarComprovantePDF(v)}
                    className="bg-fire-red hover:bg-fire-red-dark shadow-fire shrink-0"
                  >
                    <FileDown className="mr-1 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Comprovante;
