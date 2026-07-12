
CREATE TABLE public.voluntarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  nome_guerra text,
  posto_graduacao text,
  matricula text NOT NULL,
  email text,
  secao text,
  datas_selecionadas text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voluntarios TO anon, authenticated;
GRANT ALL ON public.voluntarios TO service_role;
ALTER TABLE public.voluntarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read voluntarios" ON public.voluntarios FOR SELECT USING (true);
CREATE POLICY "public insert voluntarios" ON public.voluntarios FOR INSERT WITH CHECK (true);
CREATE POLICY "public update voluntarios" ON public.voluntarios FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete voluntarios" ON public.voluntarios FOR DELETE USING (true);

CREATE TABLE public.auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data timestamptz NOT NULL DEFAULT now(),
  administrador text NOT NULL,
  acao text NOT NULL,
  nome_guerra text,
  matricula text,
  posto_graduacao text,
  secao text,
  competencia text,
  alteracoes jsonb,
  snapshot jsonb
);
GRANT SELECT, INSERT ON public.auditoria TO anon, authenticated;
GRANT ALL ON public.auditoria TO service_role;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read auditoria" ON public.auditoria FOR SELECT USING (true);
CREATE POLICY "public insert auditoria" ON public.auditoria FOR INSERT WITH CHECK (true);

CREATE TABLE public.periodos_inscricao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia text NOT NULL UNIQUE,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  aberto_manual boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.periodos_inscricao TO anon, authenticated;
GRANT ALL ON public.periodos_inscricao TO service_role;
ALTER TABLE public.periodos_inscricao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read periodos" ON public.periodos_inscricao FOR SELECT USING (true);
CREATE POLICY "public insert periodos" ON public.periodos_inscricao FOR INSERT WITH CHECK (true);
CREATE POLICY "public update periodos" ON public.periodos_inscricao FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete periodos" ON public.periodos_inscricao FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_periodos_updated_at BEFORE UPDATE ON public.periodos_inscricao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.voluntarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auditoria;
ALTER PUBLICATION supabase_realtime ADD TABLE public.periodos_inscricao;
