import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [loginType, setLoginType] = useState<"escalante" | "militar" | null>(null);
  const [credentials, setCredentials] = useState({ usuario: "", senha: "", nome: "", matricula: "" });
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
    if (credentials.nome.trim() && credentials.matricula.trim()) {
      // Simulate storing login info for the military user
      localStorage.setItem("militarInfo", JSON.stringify({
        nome: credentials.nome,
        matricula: credentials.matricula
      }));
      navigate("/militar");
    } else {
      toast({
        title: "Dados Incompletos",
        description: "Por favor, preencha nome completo e matrícula",
        variant: "destructive",
      });
    }
  };

  if (!loginType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Badge variant="outline" className="text-lg px-4 py-2 bg-military-green text-primary-foreground border-military-green">
                🪖 Voluntariado Militar
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-military-dark mb-2">Sistema de Escalas</h1>
            <p className="text-muted-foreground">Selecione seu tipo de acesso</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setLoginType("escalante")}
              className="w-full h-16 bg-military-green hover:bg-military-dark text-primary-foreground"
              size="lg"
            >
              <Shield className="mr-3 h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Escalante</div>
                <div className="text-sm opacity-90">Visualizar relatórios</div>
              </div>
            </Button>

            <Button
              onClick={() => setLoginType("militar")}
              className="w-full h-16 bg-military-light hover:bg-military-green text-military-dark hover:text-primary-foreground"
              variant="outline"
              size="lg"
            >
              <Users className="mr-3 h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Militar</div>
                <div className="text-sm opacity-75">Registrar voluntariado</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {loginType === "escalante" ? (
              <Shield className="h-12 w-12 text-military-green" />
            ) : (
              <Users className="h-12 w-12 text-military-green" />
            )}
          </div>
          <CardTitle className="text-military-dark">
            {loginType === "escalante" ? "Login Escalante" : "Login Militar"}
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
                <Label htmlFor="usuario">Usuário</Label>
                <Input
                  id="usuario"
                  value={credentials.usuario}
                  onChange={(e) => setCredentials({...credentials, usuario: e.target.value})}
                  placeholder="Escalante"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={credentials.senha}
                  onChange={(e) => setCredentials({...credentials, senha: e.target.value})}
                  placeholder="Digite sua senha"
                />
              </div>
              <Button onClick={handleEscalanteLogin} className="w-full bg-military-green hover:bg-military-dark">
                Entrar
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={credentials.nome}
                  onChange={(e) => setCredentials({...credentials, nome: e.target.value})}
                  placeholder="Digite seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  value={credentials.matricula}
                  onChange={(e) => setCredentials({...credentials, matricula: e.target.value})}
                  placeholder="Digite sua matrícula"
                />
              </div>
              <Button onClick={handleMilitarLogin} className="w-full bg-military-green hover:bg-military-dark">
                Continuar
              </Button>
            </>
          )}
          
          <Button
            onClick={() => setLoginType(null)}
            variant="outline"
            className="w-full"
          >
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;