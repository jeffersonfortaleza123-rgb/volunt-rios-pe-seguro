import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import firefighterHelmet from "@/assets/firefighter-helmet.jpg";
import firefighterEmblem from "@/assets/firefighter-emblem.jpg";

const Login = () => {
  const [loginType, setLoginType] = useState<"escalante" | "militar" | null>(null);
  const [credentials, setCredentials] = useState({ usuario: "", senha: "", nome: "", nomeGuerra: "", matricula: "" });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEscalanteLogin = () => {
    if (credentials.usuario === "Escalante" && credentials.senha === "3g") {
      navigate("/escalante");
    } else {
      toast({
        title: "Erro de Login",
        description: "Credenciais inválidas para Escalante",
        variant: "destructive",
      });
    }
  };

  const handleMilitarLogin = () => {
    if (credentials.nome.trim() && credentials.nomeGuerra.trim() && credentials.matricula.trim()) {
      localStorage.setItem("militarInfo", JSON.stringify({
        nome: credentials.nome,
        nomeGuerra: credentials.nomeGuerra,
        matricula: credentials.matricula
      }));
      navigate("/militar");
    } else {
      toast({
        title: "Dados Incompletos",
        description: "Por favor, preencha nome completo, nome de guerra e matrícula",
        variant: "destructive",
      });
    }
  };

  if (!loginType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background images */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <img 
            src={firefighterEmblem} 
            alt="Bombeiro Militar" 
            className="w-96 h-96 object-contain"
          />
        </div>
        
        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src={firefighterHelmet} 
                  alt="Capacete de Bombeiro" 
                  className="w-20 h-20 object-contain filter drop-shadow-lg"
                />
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-6 py-3 bg-fire-red text-primary-foreground border-fire-red shadow-fire mb-4">
              🔥 Bombeiros Militar
            </Badge>
            <h1 className="text-3xl font-bold text-fire-black mb-2">Sistema de Escalas</h1>
            <p className="text-muted-foreground">Corpo de Bombeiros - Voluntariado</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setLoginType("escalante")}
              className="w-full h-18 bg-fire-red hover:bg-fire-red-dark text-primary-foreground shadow-fire transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Shield className="mr-3 h-7 w-7" />
              <div className="text-left">
                <div className="font-bold text-lg">Escalante</div>
                <div className="text-sm opacity-90">Comandante - Visualizar relatórios</div>
              </div>
            </Button>

            <Button
              onClick={() => setLoginType("militar")}
              className="w-full h-18 bg-fire-gray hover:bg-fire-red text-fire-black hover:text-primary-foreground border-2 border-fire-red shadow-lg transition-all duration-300 hover:scale-105"
              variant="outline"
              size="lg"
            >
              <Flame className="mr-3 h-7 w-7" />
              <div className="text-left">
                <div className="font-bold text-lg">Bombeiro Militar</div>
                <div className="text-sm opacity-75">Registrar voluntariado</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-fire-red/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={firefighterHelmet} 
              alt="Capacete de Bombeiro" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <CardTitle className="text-fire-black text-xl">
            {loginType === "escalante" ? "Login Comandante" : "Login Bombeiro Militar"}
          </CardTitle>
          <CardDescription>
            {loginType === "escalante" 
              ? "Digite suas credenciais de acesso"
              : "Informe seus dados para registrar voluntariado"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loginType === "escalante" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-fire-black font-medium">Usuário</Label>
                <Input
                  id="usuario"
                  value={credentials.usuario}
                  onChange={(e) => setCredentials({...credentials, usuario: e.target.value})}
                  placeholder="Escalante"
                  className="border-fire-red/30 focus:border-fire-red"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-fire-black font-medium">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={credentials.senha}
                  onChange={(e) => setCredentials({...credentials, senha: e.target.value})}
                  placeholder="Digite sua senha"
                  className="border-fire-red/30 focus:border-fire-red"
                />
              </div>
              <Button onClick={handleEscalanteLogin} className="w-full bg-fire-red hover:bg-fire-red-dark shadow-fire">
                Entrar
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-fire-black font-medium">Nome Completo</Label>
                <Input
                  id="nome"
                  value={credentials.nome}
                  onChange={(e) => setCredentials({...credentials, nome: e.target.value})}
                  placeholder="Digite seu nome completo"
                  className="border-fire-red/30 focus:border-fire-red"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomeGuerra" className="text-fire-black font-medium">Nome de Guerra</Label>
                <Input
                  id="nomeGuerra"
                  value={credentials.nomeGuerra}
                  onChange={(e) => setCredentials({...credentials, nomeGuerra: e.target.value})}
                  placeholder="Ex.: SILVA"
                  className="border-fire-red/30 focus:border-fire-red"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricula" className="text-fire-black font-medium">Matrícula</Label>
                <Input
                  id="matricula"
                  value={credentials.matricula}
                  onChange={(e) => setCredentials({...credentials, matricula: e.target.value})}
                  placeholder="Digite sua matrícula"
                  className="border-fire-red/30 focus:border-fire-red"
                />
              </div>
              <Button onClick={handleMilitarLogin} className="w-full bg-fire-red hover:bg-fire-red-dark shadow-fire">
                Continuar
              </Button>
            </>
          )}
          
          <Button
            onClick={() => setLoginType(null)}
            variant="outline"
            className="w-full border-fire-red text-fire-red hover:bg-fire-red hover:text-white"
          >
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;