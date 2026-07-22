import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Militar from "./pages/Militar";
import Escalante from "./pages/Escalante";
import Relatorios from "./pages/Relatorios";
import Inscricoes from "./pages/Inscricoes";
import Auditoria from "./pages/Auditoria";
import Periodos from "./pages/Periodos";
import Comprovante from "./pages/Comprovante";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/militar" element={<Militar />} />
          <Route path="/escalante" element={<Escalante />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/inscricoes" element={<Inscricoes />} />
          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/periodos" element={<Periodos />} />
          <Route path="/comprovante" element={<Comprovante />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
