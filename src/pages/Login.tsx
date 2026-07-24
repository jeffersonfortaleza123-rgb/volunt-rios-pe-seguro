import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Flame, FileDown, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OFICIAIS, PRACAS } from "@/lib/postos";
import { fetchPeriodoAtivo, periodoAberto, Periodo } from "@/lib/db";
import brasao from "@/assets/brasao-3gb.png";

const Login = () => {
  const [loginType, setLoginType] = useState<"escalante" | "militar" | null>(null);
  const [credentials, setCredentials] = useState({ usuario: "", senha: "", nome: "", nomeGuerra: "", posto: "", matricula: "", email: "" });
  const [buscando, setBuscando] = useState(false);
  const [encontrado, setEncontrado] = useState<boolean | null>(null);

  const SHEET_URL = `https://docs.google.com/spreadsheets/d/1TWD87B5roREK74ai8VNK9SL1DODbyWE4XRK4UITazEo/export?format=csv&gid=1853790587`;

  const buscarNaPlanilha = async (matricula: string) => {
    if (!/^\d{6}-\d$/.test(matricula)) return;
    setBuscando(true);
    setEncontrado(null);
    try {
      const res = await fetch(SHEET_URL);
      const csv = await res.text();
      const linhas = csv.split("\n").map(l => l.split(",").map(c => c.replace(/^"|"$/g, "").trim()));
      // Colunas: A=Matrícula, B=Posto/Grad, C=Nome Guerra, D=Nome Completo
      const linha = linhas.find(l => l[0] === matricula.trim());
      if (linha) {
        setCredentials(prev => ({
          ...prev,
          posto: linha[1] || "",
          nomeGuerra: (linha[2] || "").toUpperCase(),
          nome: linha[3] || "",
        }));
        setEncontrado(true);
      } else {
        setCredentials(prev => ({ ...prev, posto: "", nomeGuerra: "", nome: "" }));
        setEncontrado(false);
      }
    } catch {
      setEncontrado(false);
    } finally {
      setBuscando(false);
    }
  };
  const navigate = useNavigate();
  const { toast } = useToast();

  // Contagem regressiva para o fim das inscrições (competência atual)
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    fetchPeriodoAtivo().then(setPeriodo).catch(() => setPeriodo(null));
  }, []);

  useEffect(() => {
    if (!periodo?.data_fim || !periodoAberto(periodo)) { setTimeLeft(null); return; }
    const target = new Date(periodo.data_fim + "T08:00:00").getTime();
    const tick = () => setTimeLeft(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [periodo]);

  const countdown = (() => {
    if (timeLeft === null || timeLeft <= 0) return null;
    const s = Math.floor(timeLeft / 1000);
    return {
      dias: Math.floor(s / 86400),
      horas: Math.floor((s % 86400) / 3600),
      min: Math.floor((s % 3600) / 60),
      seg: s % 60,
    };
  })();

  const CountdownBanner = () => countdown ? (
    <Card className="shadow-lg border-fire-red/40 bg-fire-red text-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Clock className="h-5 w-5" />
          <span className="font-semibold text-sm sm:text-base">As inscrições encerram em:</span>
        </div>
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto text-center">
          {[
            { valor: countdown.dias, rotulo: countdown.dias === 1 ? "dia" : "dias" },
            { valor: countdown.horas, rotulo: "horas" },
            { valor: countdown.min, rotulo: "min" },
            { valor: countdown.seg, rotulo: "seg" },
          ].map((item) => (
            <div key={item.rotulo} className="bg-white/15 rounded-lg py-2 px-1">
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">
                {String(item.valor).padStart(2, "0")}
              </div>
              <div className="text-xs uppercase tracking-wide opacity-90">{item.rotulo}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ) : null;

  const handleEscalanteLogin = () => {
    if (credentials.usuario === "Escalante" && credentials.senha === "3g") {
      sessionStorage.setItem("escalanteAuth", "1");
      sessionStorage.setItem("escalanteNome", credentials.usuario);
      navigate("/escalante");
    } else {
      toast({
        title: "Erro de Login",
        description: "Credenciais inválidas para Escalante",
        variant: "destructive",
      });
    }
  };

  const maskMatricula = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 7);
    return d.length <= 6 ? d : `${d.slice(0, 6)}-${d.slice(6)}`;
  };

  const handleMilitarLogin = () => {
    const matriculaOk = /^\d{6}-\d$/.test(credentials.matricula.trim());
    if (!matriculaOk) {
      toast({ title: "Matrícula inválida", description: "A matrícula deve estar no formato 000000-0.", variant: "destructive" });
      return;
    }
    if (!encontrado) {
      toast({ title: "Matrícula não encontrada", description: "Verifique o número e tente novamente.", variant: "destructive" });
      return;
    }
    localStorage.setItem("militarInfo", JSON.stringify({
      nome: credentials.nome,
      nomeGuerra: credentials.nomeGuerra.trim().toUpperCase(),
      posto: credentials.posto,
      matricula: credentials.matricula.trim(),
      email: "",
    }));
    navigate("/militar");
  };

  if (!loginType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background images */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <img 
            src={brasao} 
            alt="Brasão 3º GB" 
            className="w-96 h-96 object-contain"
          />
        </div>
        
        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src={brasao} 
                  alt="Brasão 3º GB" 
                  className="w-28 h-28 object-contain filter drop-shadow-lg"
                />
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-6 py-3 bg-fire-red text-primary-foreground border-fire-red shadow-fire mb-4">
              🔥 Bombeiros Militar
            </Badge>
            <h1 className="text-3xl font-extrabold text-gradient-fire mb-2">Sistema de Escalas</h1>
            <p className="text-foreground/80">Corpo de Bombeiros - Voluntariado</p>
          </div>

          <CountdownBanner />

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
              className="w-full h-18 bg-card hover:bg-fire-red text-foreground hover:text-white border-2 border-fire-red shadow-lg transition-all duration-300 hover:scale-105 font-semibold"
              variant="outline"
              size="lg"
            >
              <Flame className="mr-3 h-7 w-7" />
              <div className="text-left">
                <div className="font-bold text-lg">Bombeiro Militar</div>
                <div className="text-sm opacity-75">Registrar voluntariado</div>
              </div>
            </Button>

            <Button
              onClick={() => navigate("/comprovante")}
              variant="ghost"
              className="w-full text-fire-red hover:bg-fire-red/10"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Já se inscreveu? Baixar comprovante
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fire-light via-background to-fire-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {loginType === "militar" && <CountdownBanner />}
        <Card className="w-full shadow-xl border-fire-red/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={brasao} 
                alt="Brasão 3º GB" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <CardTitle className="text-foreground text-xl">
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
                  <Label htmlFor="usuario" className="text-foreground font-medium">Usuário</Label>
                  <Input
                    id="usuario"
                    value={credentials.usuario}
                    onChange={(e) => setCredentials({...credentials, usuario: e.target.value})}
                    placeholder="Escalante"
                    className="border-fire-red/30 focus:border-fire-red"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-foreground font-medium">Senha</Label>
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
                {encontrado === true && (
                  <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 space-y-1 text-sm">
                    <p className="text-foreground font-semibold">{credentials.posto}</p>
                    <p className="text-foreground">{credentials.nome}</p>
                    <p className="text-muted-foreground">{credentials.nomeGuerra}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="matricula" className="text-foreground font-medium">Matrícula</Label>
                  <div className="relative">
                    <Input
                      id="matricula"
                      value={credentials.matricula}
                      onChange={(e) => {
                        const masked = maskMatricula(e.target.value);
                        setCredentials({...credentials, matricula: masked});
                        if (/^\d{6}-\d$/.test(masked)) buscarNaPlanilha(masked);
                      }}
                      placeholder="000000-0"
                      inputMode="numeric"
                      maxLength={8}
                      className="border-fire-red/30 focus:border-fire-red pr-8"
                    />
                    {buscando && (
                      <span className="absolute right-2 top-2.5 text-xs text-muted-foreground animate-pulse">⏳</span>
                    )}
                    {encontrado === true && (
                      <span className="absolute right-2 top-2.5 text-green-400 text-sm">✓</span>
                    )}
                    {encontrado === false && (
                      <span className="absolute right-2 top-2.5 text-fire-red text-sm">✗</span>
                    )}
                  </div>
                  {encontrado === false && (
                    <p className="text-xs text-fire-red">Matrícula não encontrada na planilha. Verifique o número.</p>
                  )}
                  {encontrado === null && <p className="text-xs text-muted-foreground">Formato: 000000-0</p>}
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
    </div>
  );
};

export default Login;
