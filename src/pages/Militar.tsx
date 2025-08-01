import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar as CalendarIcon, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Militar = () => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
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
    if (selectedDates.length === 0) {
      toast({
        title: "Nenhum dia selecionado",
        description: "Por favor, selecione pelo menos um dia para voluntariado",
        variant: "destructive",
      });
      return;
    }

    // Simulate API call - In real app, this would save to Supabase
    try {
      const voluntarioData = {
        nome: militarInfo.nome,
        matricula: militarInfo.matricula,
        datasSelecionadas: selectedDates.map(date => date.toISOString().split('T')[0]),
        jaPreencheu: true,
        created_at: new Date().toISOString()
      };

      // Simulate saving to localStorage for demo
      const existingData = JSON.parse(localStorage.getItem("voluntarios") || "[]");
      existingData.push(voluntarioData);
      localStorage.setItem("voluntarios", JSON.stringify(existingData));

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle className="h-16 w-16 text-military-green mx-auto mb-4" />
            <CardTitle className="text-military-dark">Formulário enviado com sucesso!</CardTitle>
            <CardDescription>
              Obrigado, {militarInfo.nome}. Seus dados de voluntariado foram registrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Você selecionou {selectedDates.length} {selectedDates.length === 1 ? 'dia' : 'dias'} para voluntariado.
            </p>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="mb-2 bg-military-green text-primary-foreground border-military-green">
              🪖 Militar
            </Badge>
            <h1 className="text-2xl font-bold text-military-dark">Registro de Voluntariado</h1>
            <p className="text-muted-foreground">Bem-vindo, {militarInfo.nome}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-military-dark">
              <CalendarIcon className="h-5 w-5" />
              Selecione os dias de voluntariado
            </CardTitle>
            <CardDescription>
              Clique nos dias do calendário em que você gostaria de ser voluntário. 
              Você pode selecionar múltiplos dias.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Calendar */}
        <Card>
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
                className="rounded-md border border-military-light"
                disabled={(date) => date < new Date()}
              />
            </div>
          </CardContent>
        </Card>

        {/* Selected dates display */}
        {selectedDates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-military-dark">Dias Selecionados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map((date, index) => (
                  <Badge key={index} variant="secondary" className="bg-military-light text-military-dark">
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
            className="flex-1 bg-military-green hover:bg-military-dark"
            disabled={selectedDates.length === 0}
          >
            Enviar Formulário
          </Button>
        </div>

        {/* Info */}
        <Card className="bg-military-light/50">
          <CardContent className="p-4">
            <p className="text-sm text-military-dark">
              <strong>Atenção:</strong> Após enviar o formulário, você não poderá mais editar suas seleções. 
              Certifique-se de que todos os dias estão corretos antes de enviar.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Militar;