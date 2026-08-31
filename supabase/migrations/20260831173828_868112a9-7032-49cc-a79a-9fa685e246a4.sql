
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','gestor','supervisor','colaborador','visualizador');
CREATE TYPE public.employee_status AS ENUM ('ativo','inativo','afastado','ferias','desligado');
CREATE TYPE public.goal_direction AS ENUM ('maior_melhor','menor_melhor','igual','intervalo');
CREATE TYPE public.periodicity AS ENUM ('diaria','semanal','mensal','trimestral','semestral','anual','personalizada');
CREATE TYPE public.responsible_type AS ENUM ('individual','equipe','subgrupo','departamento','corporativa');
CREATE TYPE public.perf_status AS ENUM ('superou','atingida','atencao','nao_atingida');
CREATE TYPE public.action_status AS ENUM ('nao_iniciado','em_andamento','concluido','atrasado','cancelado');

-- ============ PROFILES / ROLES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  cpf text,
  telefone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.can_manage(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','gestor'));
$$;

CREATE OR REPLACE FUNCTION public.can_launch(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','gestor','supervisor'));
$$;

CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles_select_auth" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), COALESCE(NEW.email,''))
  ON CONFLICT (id) DO NOTHING;

  IF lower(COALESCE(NEW.email,'')) = 'cinthia@mundodigitaltech.com.br' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSIF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'colaborador') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ ORG STRUCTURE ============
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  gestor_id uuid,
  supervisor_id uuid,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.subgroups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.job_functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  cpf text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  telefone text,
  matricula text,
  status public.employee_status NOT NULL DEFAULT 'ativo',
  data_admissao date,
  data_desligamento date,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  subgroup_id uuid REFERENCES public.subgroups(id) ON DELETE SET NULL,
  position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  function_id uuid REFERENCES public.job_functions(id) ON DELETE SET NULL,
  work_schedule_id uuid REFERENCES public.work_schedules(id) ON DELETE SET NULL,
  chefia_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  supervisor_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  unidade text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ADD CONSTRAINT teams_gestor_fk FOREIGN KEY (gestor_id) REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.teams ADD CONSTRAINT teams_supervisor_fk FOREIGN KEY (supervisor_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- ============ PERFORMANCE ============
CREATE TABLE public.indicator_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.measure_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL UNIQUE, simbolo text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text UNIQUE,
  descricao text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  subgroup_id uuid REFERENCES public.subgroups(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.indicator_categories(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.measure_units(id) ON DELETE SET NULL,
  responsavel_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  periodicidade public.periodicity NOT NULL DEFAULT 'mensal',
  direcao public.goal_direction NOT NULL DEFAULT 'maior_melhor',
  formula text,
  fonte_dados text,
  meta_padrao numeric,
  meta_min numeric,
  meta_max numeric,
  peso numeric NOT NULL DEFAULT 1,
  ranking_ativo boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'ativo',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  indicator_id uuid NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  tipo_responsavel public.responsible_type NOT NULL DEFAULT 'equipe',
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  subgroup_id uuid REFERENCES public.subgroups(id) ON DELETE SET NULL,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  valor_meta numeric NOT NULL,
  peso numeric NOT NULL DEFAULT 1,
  prioridade text NOT NULL DEFAULT 'media',
  periodicidade public.periodicity NOT NULL DEFAULT 'mensal',
  descricao text,
  observacao text,
  status text NOT NULL DEFAULT 'ativa',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.goal_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  valor_anterior numeric,
  valor_novo numeric,
  justificativa text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id uuid NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ano int NOT NULL,
  mes int NOT NULL CHECK (mes BETWEEN 1 AND 12),
  valor_realizado numeric NOT NULL,
  valor_meta numeric NOT NULL,
  percentual numeric,
  status_performance public.perf_status,
  observacao text,
  justificativa text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX results_periodo_idx ON public.results (ano, mes);
CREATE INDEX results_indicator_idx ON public.results (indicator_id);

CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id uuid NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  result_id uuid REFERENCES public.results(id) ON DELETE SET NULL,
  ano int NOT NULL,
  mes int NOT NULL,
  analise text,
  causa text,
  impacto text,
  justificativa text,
  pontos_positivos text,
  pontos_negativos text,
  acoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id uuid REFERENCES public.indicators(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  o_que text NOT NULL,
  por_que text,
  quem uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  como text,
  prazo date,
  prioridade text NOT NULL DEFAULT 'media',
  status public.action_status NOT NULL DEFAULT 'nao_iniciado',
  comentario text,
  evidencia text,
  data_conclusao date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.period_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano int NOT NULL, mes int NOT NULL,
  status text NOT NULL DEFAULT 'fechado',
  fechado_por uuid, fechado_em timestamptz NOT NULL DEFAULT now(),
  reaberto_por uuid, reaberto_em timestamptz,
  observacao text,
  UNIQUE (ano, mes)
);
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL, mensagem text, tipo text NOT NULL DEFAULT 'info',
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, user_email text, operacao text NOT NULL, tabela text NOT NULL,
  registro_id text, descricao text,
  valor_anterior jsonb, valor_novo jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL, ano int, mes int, descricao text,
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.presentation_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  ordem int NOT NULL DEFAULT 1,
  tipo text NOT NULL DEFAULT 'texto',
  titulo text NOT NULL,
  conteudo text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  indicator_id uuid NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, indicator_id)
);
CREATE TABLE public.saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ GRANTS + RLS ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['departments','teams','subgroups','positions','job_functions','work_schedules','employees',
    'indicator_categories','measure_units','indicators','goals','goal_history','results','analyses','action_plans',
    'period_closures','notifications','audit_logs','presentations','presentation_slides','favorites','saved_views']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
  END LOOP;

  -- estrutura e cadastros: admin/gestor gerenciam
  FOREACH t IN ARRAY ARRAY['departments','teams','subgroups','positions','job_functions','work_schedules','employees',
    'indicator_categories','measure_units','indicators','goals','presentations','presentation_slides']
  LOOP
    EXECUTE format('CREATE POLICY "%s_manage" ON public.%I FOR ALL TO authenticated USING (public.can_manage(auth.uid())) WITH CHECK (public.can_manage(auth.uid()))', t, t);
  END LOOP;

  -- lançamentos: admin/gestor/supervisor
  FOREACH t IN ARRAY ARRAY['results','analyses','action_plans','goal_history','period_closures']
  LOOP
    EXECUTE format('CREATE POLICY "%s_launch" ON public.%I FOR ALL TO authenticated USING (public.can_launch(auth.uid())) WITH CHECK (public.can_launch(auth.uid()))', t, t);
  END LOOP;
END $$;

CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid() OR user_id IS NULL) WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "favorites_own" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_views_own" ON public.saved_views FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ DADOS DEMONSTRATIVOS ============
INSERT INTO public.indicator_categories (nome) VALUES
 ('Produtividade'),('Qualidade'),('Atendimento'),('Prazo'),('Comportamental'),
 ('Financeiro'),('Operacional'),('Cliente'),('Pessoas'),('Tecnologia');

INSERT INTO public.measure_units (nome, simbolo) VALUES
 ('Percentual','%'),('Quantidade','un'),('Minutos','min'),('Horas','h'),('Dias','d'),
 ('Reais','R$'),('Índice','idx'),('Nota','nota'),('Páginas','pág'),('Documentos','doc'),
 ('Chamados','ch'),('Atendimentos','at'),('Certificados','cert'),('Caixas','cx'),('Dossiês','dos');

INSERT INTO public.positions (nome) VALUES ('Analista'),('Assistente'),('Coordenador'),('Supervisor'),('Gerente');
INSERT INTO public.job_functions (nome) VALUES ('Suporte'),('Validação'),('Digitalização'),('Implantação'),('Sucesso do Cliente'),('Infraestrutura');
INSERT INTO public.work_schedules (nome) VALUES ('08:00 - 18:00'),('06:00 - 14:00'),('14:00 - 22:00'),('Escala 12x36');

INSERT INTO public.departments (id, nome, descricao) VALUES
 ('11111111-1111-1111-1111-111111111111','Operações','Departamento operacional da empresa'),
 ('11111111-1111-1111-1111-111111111112','Tecnologia','Departamento de tecnologia');

INSERT INTO public.teams (id, nome, department_id, descricao) VALUES
 ('22222222-2222-2222-2222-222222222201','Suporte ao Cliente','11111111-1111-1111-1111-111111111111','Atendimento e suporte'),
 ('22222222-2222-2222-2222-222222222202','TI','11111111-1111-1111-1111-111111111112','Infraestrutura e sistemas'),
 ('22222222-2222-2222-2222-222222222203','Validação de Certificado Digital','11111111-1111-1111-1111-111111111111','Validação de certificados'),
 ('22222222-2222-2222-2222-222222222204','Arquivo / Digitalização','11111111-1111-1111-1111-111111111111','Digitalização e arquivo'),
 ('22222222-2222-2222-2222-222222222205','Implantação','11111111-1111-1111-1111-111111111111','Implantação de clientes'),
 ('22222222-2222-2222-2222-222222222206','Customer Success','11111111-1111-1111-1111-111111111111','Sucesso do cliente');

INSERT INTO public.employees (id, nome, cpf, email, telefone, status, data_admissao, department_id, team_id, unidade) VALUES
 ('33333333-3333-3333-3333-333333333301','Rafael Almeida','12345678901','rafael.almeida@exemplo.com.br','11988880001','ativo','2024-02-01','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222201','Matriz'),
 ('33333333-3333-3333-3333-333333333302','Juliana Souza','12345678902','juliana.souza@exemplo.com.br','11988880002','ativo','2023-06-15','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222203','Matriz'),
 ('33333333-3333-3333-3333-333333333303','Marcos Pereira','12345678903','marcos.pereira@exemplo.com.br','11988880003','ativo','2022-09-05','11111111-1111-1111-1111-111111111112','22222222-2222-2222-2222-222222222202','Matriz'),
 ('33333333-3333-3333-3333-333333333304','Beatriz Lima','12345678904','beatriz.lima@exemplo.com.br','11988880004','ativo','2025-01-20','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222204','Matriz'),
 ('33333333-3333-3333-3333-333333333305','Carlos Nunes','12345678905','carlos.nunes@exemplo.com.br','11988880005','ativo','2024-11-11','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222206','Matriz');

UPDATE public.teams SET gestor_id='33333333-3333-3333-3333-333333333301' WHERE id='22222222-2222-2222-2222-222222222201';
UPDATE public.teams SET gestor_id='33333333-3333-3333-3333-333333333303' WHERE id='22222222-2222-2222-2222-222222222202';

INSERT INTO public.indicators (id, nome, codigo, descricao, department_id, team_id, category_id, unit_id, responsavel_id, direcao, meta_padrao, peso) VALUES
 ('44444444-4444-4444-4444-444444444401','SLA','SUP-SLA','Percentual de chamados dentro do SLA','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222201',(SELECT id FROM public.indicator_categories WHERE nome='Atendimento'),(SELECT id FROM public.measure_units WHERE nome='Percentual'),'33333333-3333-3333-3333-333333333301','maior_melhor',95,30),
 ('44444444-4444-4444-4444-444444444402','TMA','SUP-TMA','Tempo médio de atendimento','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222201',(SELECT id FROM public.indicator_categories WHERE nome='Atendimento'),(SELECT id FROM public.measure_units WHERE nome='Minutos'),'33333333-3333-3333-3333-333333333301','menor_melhor',10,20),
 ('44444444-4444-4444-4444-444444444403','CSAT','CS-CSAT','Satisfação do cliente','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222206',(SELECT id FROM public.indicator_categories WHERE nome='Cliente'),(SELECT id FROM public.measure_units WHERE nome='Percentual'),'33333333-3333-3333-3333-333333333305','maior_melhor',90,20),
 ('44444444-4444-4444-4444-444444444404','Disponibilidade dos Sistemas','TI-DISP','Uptime dos sistemas','11111111-1111-1111-1111-111111111112','22222222-2222-2222-2222-222222222202',(SELECT id FROM public.indicator_categories WHERE nome='Tecnologia'),(SELECT id FROM public.measure_units WHERE nome='Percentual'),'33333333-3333-3333-3333-333333333303','maior_melhor',99.5,25),
 ('44444444-4444-4444-4444-444444444405','Produtividade Digitalização','ARQ-PROD','Produtividade da equipe de digitalização','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222204',(SELECT id FROM public.indicator_categories WHERE nome='Produtividade'),(SELECT id FROM public.measure_units WHERE nome='Percentual'),'33333333-3333-3333-3333-333333333304','maior_melhor',95,20),
 ('44444444-4444-4444-4444-444444444406','Quantidade de Validações','VAL-QTD','Certificados validados no mês','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222203',(SELECT id FROM public.indicator_categories WHERE nome='Operacional'),(SELECT id FROM public.measure_units WHERE nome='Certificados'),'33333333-3333-3333-3333-333333333302','maior_melhor',800,15),
 ('44444444-4444-4444-4444-444444444407','Taxa de Retrabalho','VAL-RET','Percentual de retrabalho na validação','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222203',(SELECT id FROM public.indicator_categories WHERE nome='Qualidade'),(SELECT id FROM public.measure_units WHERE nome='Percentual'),'33333333-3333-3333-3333-333333333302','menor_melhor',5,15),
 ('44444444-4444-4444-4444-444444444408','Páginas Digitalizadas','ARQ-PAG','Volume mensal de páginas','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222204',(SELECT id FROM public.indicator_categories WHERE nome='Produtividade'),(SELECT id FROM public.measure_units WHERE nome='Páginas'),'33333333-3333-3333-3333-333333333304','maior_melhor',50000,10);

INSERT INTO public.goals (titulo, indicator_id, tipo_responsavel, team_id, department_id, periodo_inicio, periodo_fim, valor_meta, peso)
SELECT 'Meta 2026 · ' || i.nome, i.id, 'equipe', i.team_id, i.department_id, '2026-01-01', '2026-12-31', i.meta_padrao, i.peso
FROM public.indicators i;

INSERT INTO public.results (indicator_id, team_id, department_id, ano, mes, valor_realizado, valor_meta, percentual, status_performance, goal_id)
SELECT i.id, i.team_id, i.department_id, 2026, m.mes,
  CASE i.codigo
    WHEN 'SUP-SLA' THEN (ARRAY[92,96,97,94,98,96,88,97])[m.mes]
    WHEN 'SUP-TMA' THEN (ARRAY[13,11,9,10,9,10,12,9])[m.mes]
    WHEN 'CS-CSAT' THEN (ARRAY[88,89,91,90,87,88,86,86])[m.mes]
    WHEN 'TI-DISP' THEN (ARRAY[99.2,99.6,99.8,99.9,99.4,99.7,99.8,99.8])[m.mes]
    WHEN 'ARQ-PROD' THEN (ARRAY[86,88,90,84,83,80,79,81])[m.mes]
    WHEN 'VAL-QTD' THEN (ARRAY[760,820,845,790,880,910,860,905])[m.mes]
    WHEN 'VAL-RET' THEN (ARRAY[7,6,5,4,5,6,5,4])[m.mes]
    ELSE (ARRAY[42000,48000,51000,49000,53000,50000,47000,52000])[m.mes]
  END,
  i.meta_padrao, NULL, NULL,
  (SELECT g.id FROM public.goals g WHERE g.indicator_id = i.id LIMIT 1)
FROM public.indicators i CROSS JOIN (SELECT generate_series(1,8) AS mes) m;

UPDATE public.results r SET
  percentual = CASE WHEN i.direcao='menor_melhor' AND r.valor_realizado > 0
                    THEN round((r.valor_meta / r.valor_realizado) * 100, 2)
                    WHEN r.valor_meta > 0 THEN round((r.valor_realizado / r.valor_meta) * 100, 2)
                    ELSE 0 END
FROM public.indicators i WHERE i.id = r.indicator_id;

UPDATE public.results SET status_performance =
  CASE WHEN percentual >= 105 THEN 'superou'::public.perf_status
       WHEN percentual >= 100 THEN 'atingida'::public.perf_status
       WHEN percentual >= 90 THEN 'atencao'::public.perf_status
       ELSE 'nao_atingida'::public.perf_status END;

INSERT INTO public.action_plans (indicator_id, team_id, o_que, por_que, quem, como, prazo, prioridade, status) VALUES
 ('44444444-4444-4444-4444-444444444405','22222222-2222-2222-2222-222222222204','Revisar fluxo de digitalização','Produtividade abaixo da meta por 3 meses','33333333-3333-3333-3333-333333333304','Mapear gargalos e redistribuir caixas','2026-09-30','alta','em_andamento'),
 ('44444444-4444-4444-4444-444444444403','22222222-2222-2222-2222-222222222206','Plano de recuperação de CSAT','Queda contínua na satisfação','33333333-3333-3333-3333-333333333305','Pesquisa de causa raiz com clientes detratores','2026-09-15','alta','nao_iniciado');

INSERT INTO public.analyses (indicator_id, ano, mes, analise, causa, impacto) VALUES
 ('44444444-4444-4444-4444-444444444405',2026,8,'Produtividade segue abaixo da meta pelo terceiro mês consecutivo.','Redução de equipe e aumento do volume de caixas.','Atraso no cumprimento de prazos contratuais.');
