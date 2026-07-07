import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Calendar, Users, Flame, FileText } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

interface Voluntario {
  nome: string;
  nome_guerra?: string;
  matricula: string;
  secao?: string;
  datasSelecionadas: string[];
  jaPreencheu: boolean;
  created_at: string;
}

const Escalante = () => {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [relatorioDias, setRelatorioDias] = useState<{ [key: string]: string[] }>({});
  const navigate = useNavigate();

  useEffect(() => {
    // Load data from localStorage (in real app, this would be from Supabase)
    const data = JSON.parse(localStorage.getItem("voluntarios") || "[]");
    setVoluntarios(data);
    
    // Generate report by day
    const relatorio: { [key: string]: string[] } = {};
    
    data.forEach((voluntario: Voluntario) => {
      voluntario.datasSelecionadas.forEach(data => {
        const day = new Date(data).getDate().toString().padStart(2, '0');
        if (!relatorio[day]) {
          relatorio[day] = [];
        }
        const label = voluntario.nome_guerra ? `${voluntario.nome} (${voluntario.nome_guerra})` : voluntario.nome;
        relatorio[day].push(label);
      });
    });
    
    setRelatorioDias(relatorio);
  }, []);

  const handleLogout = () => {
    navigate("/");
  };

  const getDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
  };

  const getCurrentMonthName = () => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[new Date().getMonth()];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="mb-2 bg-fire-red text-primary-foreground border-fire-red shadow-fire">
              🛡️ Comandante
            </Badge>
            <h1 className="text-2xl font-bold text-fire-black">Relatório de Voluntários</h1>
            <p className="text-muted-foreground">{getCurrentMonthName()} de {new Date().getFullYear()}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="border-fire-red text-fire-red hover:bg-fire-red hover:text-white">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-lg border-fire-red/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-fire-red" />
                <div>
                  <p className="text-2xl font-bold text-fire-black">{voluntarios.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Bombeiros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-fire-red/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-fire-red" />
                <div>
                  <p className="text-2xl font-bold text-fire-black">
                    {Object.keys(relatorioDias).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Dias com Voluntários</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-fire-red/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Flame className="h-8 w-8 text-fire-red" />
                <div>
                  <p className="text-2xl font-bold text-fire-black">
                    {voluntarios.reduce((total, v) => total + v.datasSelecionadas.length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total de Escalas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report */}
        <Card className="shadow-lg border-fire-red/20">
          <CardHeader>
            <CardTitle className="text-fire-black flex items-center gap-2">
              <Flame className="h-5 w-5 text-fire-red" />
              Relatório por Dia
            </CardTitle>
            <CardDescription>
              Bombeiros voluntários disponíveis para cada dia do mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getDaysInMonth().map(day => (
                <div key={day} className="flex items-start gap-4 p-3 border border-fire-red/20 rounded-lg hover:bg-fire-light/50 transition-colors">
                  <div className="min-w-[3rem]">
                    <Badge variant="outline" className="text-sm font-mono border-fire-red text-fire-red">
                      {day}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    {relatorioDias[day] && relatorioDias[day].length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {relatorioDias[day].map((nome, index) => (
                          <span key={index} className="text-fire-black font-medium">
                            {nome}
                            {index < relatorioDias[day].length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">-</span>
                    )}
                  </div>
                  {relatorioDias[day] && (
                    <Badge variant="secondary" className="ml-auto bg-fire-gray text-fire-black border border-fire-red/20">
                      {relatorioDias[day].length}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Volunteers List */}
        {voluntarios.length > 0 && (
          <Card className="shadow-lg border-fire-red/20">
            <CardHeader>
              <CardTitle className="text-fire-black">Lista Detalhada de Bombeiros</CardTitle>
              <CardDescription>
                Informações completas dos bombeiros militares que se voluntariaram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {voluntarios.map((voluntario, index) => (
                  <div key={index} className="border border-fire-red/20 rounded-lg p-4 bg-card shadow-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-fire-black">{voluntario.nome}</h4>
                        <p className="text-sm text-muted-foreground">Matrícula: {voluntario.matricula}</p>
                      </div>
                      <Badge variant="secondary" className="bg-fire-gray text-fire-black border border-fire-red/20">
                        {voluntario.datasSelecionadas.length} {voluntario.datasSelecionadas.length === 1 ? 'dia' : 'dias'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {voluntario.datasSelecionadas.map((data, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-fire-red/30">
                          {new Date(data).toLocaleDateString('pt-BR')}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Enviado em: {new Date(voluntario.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {voluntarios.length === 0 && (
          <Card className="shadow-lg border-fire-red/20">
            <CardContent className="p-8 text-center">
              <Flame className="h-12 w-12 text-fire-red mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-fire-black mb-2">Nenhum bombeiro registrado</h3>
              <p className="text-muted-foreground">
                Aguardando bombeiros militares se voluntariarem para as escalas do mês.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Escalante;