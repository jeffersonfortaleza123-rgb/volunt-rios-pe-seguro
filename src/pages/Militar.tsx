import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar as CalendarIcon, LogOut, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { logAudit, competenciaFromDates } from "@/lib/audit";

const SECOES = ["Primeira Seção", "Segunda Seção", "Terceira Seção", "Quarta Seção"];

const Militar = () => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [secao, setSecao] = useState<string>("");
  const [militarInfo, setMilitarInfo] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const info = localStorage.getItem("militarInfo");
    if (!info) {
      navigate("/");
      return;
    }
    setMilitarInfo(JSON.parse(info));
  }, [navigate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const isSelected = selectedDates.some(d => 
      d.getDate() === date.getDate() && 
      d.getMonth() === date.getMonth() && 
      d.getFullYear() === date.getFullYear()
    );

    if (isSelected) {
      setSelectedDates(selectedDates.filter(d => 
        !(d.getDate() === date.getDate() && 
          d.getMonth() === date.getMonth() && 
          d.getFullYear() === date.getFullYear())
      ));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleSubmit = async () => {
    if (!secao) {
      toast({
        title: "Seção não selecionada",
        description: "Escolha onde deseja tirar o serviço extraordinário",
        variant: "destructive",
      });
      return;
    }
    if (selectedDates.length === 0) {
      toast({
        title: "Nenhum dia selecionado",
        description: "Por favor, selecione pelo menos um dia para voluntariado",
        variant: "destructive",
      });
      return;
    }

    try {
      const voluntarioData = {
        id: crypto.randomUUID(),
        nome: militarInfo.nome,
        nome_guerra: militarInfo.nomeGuerra || "",
        posto_graduacao: militarInfo.posto || "",
        matricula: militarInfo.matricula,
        email: militarInfo.email || "",
        secao,
        datasSelecionadas: selectedDates.map(date => date.toISOString().split('T')[0]),
        jaPreencheu: true,
        created_at: new Date().toISOString()
      };

      const existingData = JSON.parse(localStorage.getItem("voluntarios") || "[]");
      existingData.push(voluntarioData);
      localStorage.setItem("voluntarios", JSON.stringify(existingData));

      logAudit({
        administrador: "Autoinscrição",
        acao: "Nova inscrição",
        nome_guerra: voluntarioData.nome_guerra,
        matricula: voluntarioData.matricula,
        posto_graduacao: voluntarioData.posto_graduacao,
        secao: voluntarioData.secao,
        competencia: competenciaFromDates(voluntarioData.datasSelecionadas),
        snapshot: voluntarioData,
      });

      setIsSubmitted(true);
      toast({
        title: "Formulário enviado com sucesso!",
        description: "Seus dados de voluntariado foram registrados.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar formulário. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("militarInfo");
    navigate("/");
  };

  if (!militarInfo) {
    return null;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-fire-red/20">
          <CardHeader>
            <CheckCircle className="h-16 w-16 text-fire-red mx-auto mb-4" />
            <CardTitle className="text-fire-black">Formulário enviado com sucesso!</CardTitle>
            <CardDescription>
              Obrigado, {militarInfo.nome}. Seus dados de voluntariado foram registrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Você selecionou {selectedDates.length} {selectedDates.length === 1 ? 'dia' : 'dias'} para voluntariado.
            </p>
            <Button onClick={handleLogout} variant="outline" className="w-full border-fire-red text-fire-red hover:bg-fire-red hover:text-white">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="mb-2 bg-fire-red text-primary-foreground border-fire-red shadow-fire">
              🔥 Bombeiro Militar
            </Badge>
            <h1 className="text-2xl font-bold text-fire-black">Registro de Voluntariado</h1>
            <p className="text-muted-foreground">Bem-vindo, {militarInfo.nome}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="border-fire-red text-fire-red hover:bg-fire-red hover:text-white">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Seção */}
        <Card className="shadow-lg border-fire-red/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-fire-black">
              <Flame className="h-5 w-5 text-fire-red" />
              Onde deseja tirar o serviço extraordinário?
            </CardTitle>
            <CardDescription>
              Selecione a seção. Depois escolha os dias no calendário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {SECOES.map((s) => (
                <Button
                  key={s}
                  type="button"
                  onClick={() => setSecao(s)}
                  variant={secao === s ? "default" : "outline"}
                  className={secao === s
                    ? "bg-fire-red hover:bg-fire-red-dark text-white"
                    : "border-fire-red text-fire-red hover:bg-fire-red hover:text-white"}
                >
                  {s}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        {secao && (
        <Card className="shadow-lg border-fire-red/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-fire-black">
              <Flame className="h-5 w-5 text-fire-red" />
              Selecione os dias de voluntariado — {secao}
            </CardTitle>
            <CardDescription>
              Clique nos dias do calendário em que você gostaria de ser voluntário.
              Você pode selecionar múltiplos dias.
            </CardDescription>
          </CardHeader>
        </Card>
        )}

        {/* Calendar */}
        {secao && (
        <Card className="shadow-lg border-fire-red/20">
          <CardContent className="p-6">
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => {
                  if (dates) {
                    setSelectedDates(Array.isArray(dates) ? dates : [dates]);
                  }
                }}
                className="rounded-md border border-fire-red/30"
                disabled={(date) => date < new Date()}
              />
            </div>
          </CardContent>
        </Card>
        )}

        {/* Selected dates display */}
        {selectedDates.length > 0 && (
          <Card className="shadow-lg border-fire-red/20">
            <CardHeader>
              <CardTitle className="text-fire-black">Dias Selecionados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map((date, index) => (
                  <Badge key={index} variant="secondary" className="bg-fire-gray text-fire-black border border-fire-red/20">
                    {date.toLocaleDateString('pt-BR')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit button */}
        <div className="flex gap-4">
          <Button 
            onClick={handleSubmit}
            className="flex-1 bg-fire-red hover:bg-fire-red-dark shadow-fire text-lg py-6 transition-all duration-300 hover:scale-105"
            disabled={selectedDates.length === 0}
          >
            <Flame className="mr-2 h-5 w-5" />
            Enviar Formulário
          </Button>
        </div>

        {/* Info */}
        <Card className="bg-fire-light/80 shadow-lg border-fire-red/20">
          <CardContent className="p-4">
            <p className="text-sm text-fire-black">
              <strong>⚠️ Atenção:</strong> Após enviar o formulário, você não poderá mais editar suas seleções. 
              Certifique-se de que todos os dias estão corretos antes de enviar.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Militar;