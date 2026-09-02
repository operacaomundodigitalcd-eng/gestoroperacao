-- ============ TABELAS ============
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system_role boolean NOT NULL DEFAULT false,
  is_super_admin boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  module text NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_permissions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'ALLOW' CHECK (type IN ('ALLOW','DENY')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, permission_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_access_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope_type text NOT NULL CHECK (scope_type IN ('COMPANY','DEPARTMENT','TEAM','SUBGROUP','EMPLOYEE','SELF')),
  scope_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX user_access_scopes_uniq ON public.user_access_scopes (user_id, scope_type, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_access_scopes TO authenticated;
GRANT ALL ON public.user_access_scopes TO service_role;
ALTER TABLE public.user_access_scopes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ativo',
  valid_from date,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_accounts TO authenticated;
GRANT ALL ON public.user_accounts TO service_role;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER user_accounts_touch BEFORE UPDATE ON public.user_accounts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER roles_touch BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.user_roles ADD COLUMN role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE;

-- ============ CATÁLOGO DE PERMISSÕES ============
INSERT INTO public.permissions (code, module, action, description) VALUES
('dashboard.view','dashboard','view','Visualizar dashboard'),
('dashboard.executive_view','dashboard','executive_view','Visualizar dashboard executivo'),
('dashboard.team_view','dashboard','team_view','Visualizar dashboard por equipe'),
('employees.view','employees','view','Visualizar colaboradores'),
('employees.create','employees','create','Criar colaboradores'),
('employees.edit','employees','edit','Editar colaboradores'),
('employees.inactivate','employees','inactivate','Inativar colaboradores'),
('employees.export','employees','export','Exportar colaboradores'),
('users.view','users','view','Visualizar usuários'),
('users.create','users','create','Criar usuários'),
('users.edit','users','edit','Editar usuários'),
('users.inactivate','users','inactivate','Inativar usuários'),
('users.change_role','users','change_role','Alterar perfil de usuário'),
('roles.view','roles','view','Visualizar perfis'),
('roles.create','roles','create','Criar perfis'),
('roles.edit','roles','edit','Editar perfis'),
('roles.duplicate','roles','duplicate','Duplicar perfis'),
('roles.inactivate','roles','inactivate','Inativar perfis'),
('roles.delete','roles','delete','Excluir perfis'),
('roles.manage_permissions','roles','manage_permissions','Gerenciar permissões'),
('indicators.view','indicators','view','Visualizar indicadores'),
('indicators.create','indicators','create','Criar indicadores'),
('indicators.edit','indicators','edit','Editar indicadores'),
('indicators.delete','indicators','delete','Excluir indicadores'),
('indicators.manage','indicators','manage','Administrar indicadores'),
('goals.view','goals','view','Visualizar metas'),
('goals.create','goals','create','Criar metas'),
('goals.edit','goals','edit','Editar metas'),
('goals.delete','goals','delete','Excluir metas'),
('goals.approve','goals','approve','Aprovar metas'),
('results.view','results','view','Visualizar resultados'),
('results.create','results','create','Lançar resultados'),
('results.edit','results','edit','Editar resultados'),
('results.approve','results','approve','Aprovar resultados'),
('results.reopen_period','results','reopen_period','Encerrar e reabrir competências'),
('results.export','results','export','Exportar resultados'),
('analyses.view','analyses','view','Visualizar análises'),
('analyses.create','analyses','create','Criar análises'),
('analyses.edit','analyses','edit','Editar análises'),
('analyses.delete','analyses','delete','Excluir análises'),
('action_plans.view','action_plans','view','Visualizar planos de ação'),
('action_plans.create','action_plans','create','Criar planos de ação'),
('action_plans.edit','action_plans','edit','Editar planos de ação'),
('action_plans.delete','action_plans','delete','Excluir planos de ação'),
('action_plans.finish','action_plans','finish','Concluir planos de ação'),
('meetings.view','meetings','view','Visualizar reuniões'),
('meetings.create','meetings','create','Criar reuniões'),
('meetings.edit','meetings','edit','Editar reuniões'),
('meetings.present','meetings','present','Apresentar reuniões'),
('meetings.finish','meetings','finish','Encerrar reuniões'),
('meetings.reopen','meetings','reopen','Reabrir reuniões'),
('meetings.generate_minutes','meetings','generate_minutes','Gerar ata de reunião'),
('presentations.view','presentations','view','Visualizar apresentações'),
('presentations.create','presentations','create','Criar apresentações'),
('presentations.edit','presentations','edit','Editar apresentações'),
('presentations.generate','presentations','generate','Gerar apresentações'),
('presentations.export','presentations','export','Exportar apresentações'),
('reports.view','reports','view','Visualizar relatórios'),
('reports.generate','reports','generate','Gerar relatórios'),
('reports.export','reports','export','Exportar relatórios'),
('audit.view','audit','view','Visualizar auditoria'),
('settings.view','settings','view','Visualizar configurações'),
('settings.edit','settings','edit','Alterar configurações');

-- ============ PERFIS MODELO ============
INSERT INTO public.roles (name, description, is_system_role, is_super_admin) VALUES
('Administrador Geral','Acesso total e irrestrito a todas as funcionalidades do sistema.', true, true),
('Gestor','Gestão de estrutura, indicadores, metas e resultados.', false, false),
('Supervisor','Acompanhamento e lançamento de resultados da sua área.', false, false),
('Colaborador','Consulta dos próprios indicadores e resultados.', false, false),
('Visualizador','Somente leitura de painéis e relatórios.', false, false);

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p WHERE r.name = 'Administrador Geral';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'Gestor' AND p.module NOT IN ('users','roles','audit')
  AND p.code <> 'settings.edit';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'Supervisor' AND p.code IN (
  'dashboard.view','dashboard.team_view','employees.view','indicators.view','goals.view',
  'results.view','results.create','results.edit','results.export',
  'analyses.view','analyses.create','analyses.edit',
  'action_plans.view','action_plans.create','action_plans.edit','action_plans.finish',
  'meetings.view','presentations.view','reports.view','reports.generate','settings.view');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'Colaborador' AND p.code IN (
  'dashboard.view','dashboard.team_view','indicators.view','goals.view','results.view',
  'analyses.view','action_plans.view','presentations.view','reports.view');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'Visualizador' AND p.code IN (
  'dashboard.view','indicators.view','goals.view','results.view','presentations.view','reports.view');

-- migra vínculos existentes
UPDATE public.user_roles ur SET role_id = r.id
FROM public.roles r
WHERE r.name = CASE ur.role
  WHEN 'admin' THEN 'Administrador Geral'
  WHEN 'gestor' THEN 'Gestor'
  WHEN 'supervisor' THEN 'Supervisor'
  WHEN 'colaborador' THEN 'Colaborador'
  ELSE 'Visualizador' END;

INSERT INTO public.user_accounts (user_id, employee_id)
SELECT p.id, e.id FROM public.profiles p LEFT JOIN public.employees e ON e.user_id = p.id
ON CONFLICT (user_id) DO NOTHING;

-- ============ FUNÇÕES DE ACESSO ============
CREATE OR REPLACE FUNCTION public.is_super_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _uid AND r.is_super_admin AND r.active
  );
$$;

CREATE OR REPLACE FUNCTION public.has_perm(_uid uuid, _code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.is_super_admin(_uid) THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.user_permissions up JOIN public.permissions p ON p.id = up.permission_id
      WHERE up.user_id = _uid AND p.code = _code AND up.type = 'DENY'
    ) THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_permissions up JOIN public.permissions p ON p.id = up.permission_id
      WHERE up.user_id = _uid AND p.code = _code AND up.type = 'ALLOW'
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id AND r.active
      JOIN public.role_permissions rp ON rp.role_id = r.id AND rp.allowed
      JOIN public.permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = _uid AND p.code = _code
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.in_scope(_uid uuid, _department uuid, _team uuid, _subgroup uuid, _employee uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.is_super_admin(_uid) THEN true
    WHEN NOT EXISTS (SELECT 1 FROM public.user_access_scopes s WHERE s.user_id = _uid) THEN true
    WHEN EXISTS (SELECT 1 FROM public.user_access_scopes s WHERE s.user_id = _uid AND s.scope_type = 'COMPANY') THEN true
    ELSE EXISTS (
      SELECT 1 FROM public.user_access_scopes s
      LEFT JOIN public.employees me ON me.user_id = _uid
      WHERE s.user_id = _uid AND (
        (s.scope_type = 'DEPARTMENT' AND (
           s.scope_id = _department
           OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = _team AND t.department_id = s.scope_id)))
        OR (s.scope_type = 'TEAM' AND (
           s.scope_id = _team
           OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = _employee AND e.team_id = s.scope_id)
           OR EXISTS (SELECT 1 FROM public.subgroups sg WHERE sg.id = _subgroup AND sg.team_id = s.scope_id)))
        OR (s.scope_type = 'SUBGROUP' AND s.scope_id = _subgroup)
        OR (s.scope_type = 'EMPLOYEE' AND s.scope_id = _employee)
        OR (s.scope_type = 'SELF' AND me.id IS NOT NULL AND me.id = _employee)
      )
    )
  END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_perm(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.in_scope(uuid, uuid, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;

-- ============ PROTEÇÃO DO ADMINISTRADOR GERAL ============
CREATE OR REPLACE FUNCTION public.protect_system_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_system_role THEN RAISE EXCEPTION 'O perfil Administrador Geral não pode ser excluído.'; END IF;
    RETURN OLD;
  END IF;
  IF OLD.is_system_role THEN
    IF NEW.active = false THEN RAISE EXCEPTION 'O perfil Administrador Geral não pode ser inativado.'; END IF;
    NEW.is_super_admin := true;
    NEW.is_system_role := true;
    NEW.name := OLD.name;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER roles_protect BEFORE UPDATE OR DELETE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.protect_system_role();

CREATE OR REPLACE FUNCTION public.protect_system_role_permissions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role uuid;
BEGIN
  _role := COALESCE(OLD.role_id, NEW.role_id);
  IF EXISTS (SELECT 1 FROM public.roles r WHERE r.id = _role AND r.is_system_role) THEN
    RAISE EXCEPTION 'As permissões do perfil Administrador Geral não podem ser alteradas.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER role_permissions_protect BEFORE UPDATE OR DELETE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.protect_system_role_permissions();

CREATE OR REPLACE FUNCTION public.protect_last_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.roles r WHERE r.id = OLD.role_id AND r.is_super_admin) THEN
    IF (SELECT count(*) FROM public.user_roles ur JOIN public.roles r ON r.id = ur.role_id WHERE r.is_super_admin) <= 1 THEN
      RAISE EXCEPTION 'É necessário manter ao menos um Administrador Geral ativo.';
    END IF;
  END IF;
  RETURN OLD;
END; $$;
CREATE TRIGGER user_roles_protect_last_admin BEFORE DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.protect_last_admin();

-- ============ AUDITORIA DE ACESSO ============
CREATE OR REPLACE FUNCTION public.audit_access()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text;
BEGIN
  SELECT email INTO _email FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (user_id, user_email, operacao, tabela, registro_id, descricao, valor_anterior, valor_novo)
  VALUES (
    auth.uid(), _email,
    CASE TG_OP WHEN 'INSERT' THEN 'criar' WHEN 'UPDATE' THEN 'editar' ELSE 'excluir' END,
    TG_TABLE_NAME,
    NULL,
    'Controle de acesso: ' || TG_OP || ' em ' || TG_TABLE_NAME,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER roles_audit AFTER INSERT OR UPDATE OR DELETE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.audit_access();
CREATE TRIGGER role_permissions_audit AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.audit_access();
CREATE TRIGGER user_roles_audit AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_access();
CREATE TRIGGER user_permissions_audit AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.audit_access();
CREATE TRIGGER user_access_scopes_audit AFTER INSERT OR UPDATE OR DELETE ON public.user_access_scopes FOR EACH ROW EXECUTE FUNCTION public.audit_access();

-- ============ NOVO USUÁRIO ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role uuid;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), COALESCE(NEW.email,''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_accounts (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  IF lower(COALESCE(NEW.email,'')) = 'cinthia@mundodigitaltech.com.br'
     OR NOT EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id = ur.role_id WHERE r.is_super_admin) THEN
    SELECT id INTO _role FROM public.roles WHERE is_super_admin LIMIT 1;
    INSERT INTO public.user_roles (user_id, role, role_id) VALUES (NEW.id, 'admin', _role) ON CONFLICT DO NOTHING;
  ELSE
    SELECT id INTO _role FROM public.roles WHERE name = 'Colaborador' LIMIT 1;
    INSERT INTO public.user_roles (user_id, role, role_id) VALUES (NEW.id, 'colaborador', _role) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

-- ============ POLÍTICAS ============
DROP POLICY IF EXISTS action_plans_launch ON public.action_plans;
DROP POLICY IF EXISTS action_plans_select_scoped ON public.action_plans;
DROP POLICY IF EXISTS analyses_launch ON public.analyses;
DROP POLICY IF EXISTS analyses_select_scoped ON public.analyses;
DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;
DROP POLICY IF EXISTS departments_manage ON public.departments;
DROP POLICY IF EXISTS employees_manage ON public.employees;
DROP POLICY IF EXISTS employees_select_scoped ON public.employees;
DROP POLICY IF EXISTS goal_history_launch ON public.goal_history;
DROP POLICY IF EXISTS goal_history_select_scoped ON public.goal_history;
DROP POLICY IF EXISTS goals_manage ON public.goals;
DROP POLICY IF EXISTS goals_select_scoped ON public.goals;
DROP POLICY IF EXISTS indicator_categories_manage ON public.indicator_categories;
DROP POLICY IF EXISTS indicators_manage ON public.indicators;
DROP POLICY IF EXISTS indicators_select ON public.indicators;
DROP POLICY IF EXISTS job_functions_manage ON public.job_functions;
DROP POLICY IF EXISTS measure_units_manage ON public.measure_units;
DROP POLICY IF EXISTS period_closures_launch ON public.period_closures;
DROP POLICY IF EXISTS positions_manage ON public.positions;
DROP POLICY IF EXISTS presentation_slides_manage ON public.presentation_slides;
DROP POLICY IF EXISTS presentations_manage ON public.presentations;
DROP POLICY IF EXISTS profiles_admin_write ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
DROP POLICY IF EXISTS results_launch ON public.results;
DROP POLICY IF EXISTS results_select_scoped ON public.results;
DROP POLICY IF EXISTS subgroups_manage ON public.subgroups;
DROP POLICY IF EXISTS teams_manage ON public.teams;
DROP POLICY IF EXISTS work_schedules_manage ON public.work_schedules;
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;

CREATE POLICY roles_select ON public.roles FOR SELECT TO authenticated USING (public.has_perm(auth.uid(),'roles.view'));
CREATE POLICY roles_manage ON public.roles FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'roles.edit')) WITH CHECK (public.has_perm(auth.uid(),'roles.edit'));
CREATE POLICY permissions_select ON public.permissions FOR SELECT TO authenticated USING (public.has_perm(auth.uid(),'roles.view'));
CREATE POLICY role_permissions_select ON public.role_permissions FOR SELECT TO authenticated USING (public.has_perm(auth.uid(),'roles.view'));
CREATE POLICY role_permissions_manage ON public.role_permissions FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'roles.manage_permissions')) WITH CHECK (public.has_perm(auth.uid(),'roles.manage_permissions'));

CREATE POLICY user_permissions_select ON public.user_permissions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_perm(auth.uid(),'users.view'));
CREATE POLICY user_permissions_manage ON public.user_permissions FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'users.change_role')) WITH CHECK (public.has_perm(auth.uid(),'users.change_role'));
CREATE POLICY user_access_scopes_select ON public.user_access_scopes FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_perm(auth.uid(),'users.view'));
CREATE POLICY user_access_scopes_manage ON public.user_access_scopes FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'users.edit')) WITH CHECK (public.has_perm(auth.uid(),'users.edit'));
CREATE POLICY user_accounts_select ON public.user_accounts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_perm(auth.uid(),'users.view'));
CREATE POLICY user_accounts_manage ON public.user_accounts FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'users.edit')) WITH CHECK (public.has_perm(auth.uid(),'users.edit'));

CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_perm(auth.uid(),'users.view'));
CREATE POLICY user_roles_manage ON public.user_roles FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'users.change_role')) WITH CHECK (public.has_perm(auth.uid(),'users.change_role'));

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_perm(auth.uid(),'users.view'));
CREATE POLICY profiles_manage ON public.profiles FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'users.edit')) WITH CHECK (public.has_perm(auth.uid(),'users.edit'));

CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated USING (public.has_perm(auth.uid(),'audit.view'));

CREATE POLICY departments_manage ON public.departments FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'settings.edit')) WITH CHECK (public.has_perm(auth.uid(),'settings.edit'));
CREATE POLICY teams_manage ON public.teams FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'settings.edit')) WITH CHECK (public.has_perm(auth.uid(),'settings.edit'));
CREATE POLICY subgroups_manage ON public.subgroups FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'settings.edit')) WITH CHECK (public.has_perm(auth.uid(),'settings.edit'));
CREATE POLICY positions_manage ON public.positions FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'settings.edit')) WITH CHECK (public.has_perm(auth.uid(),'settings.edit'));
CREATE POLICY job_functions_manage ON public.job_functions FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'settings.edit')) WITH CHECK (public.has_perm(auth.uid(),'settings.edit'));
CREATE POLICY work_schedules_manage ON public.work_schedules FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'settings.edit')) WITH CHECK (public.has_perm(auth.uid(),'settings.edit'));
CREATE POLICY measure_units_manage ON public.measure_units FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'settings.edit')) WITH CHECK (public.has_perm(auth.uid(),'settings.edit'));
CREATE POLICY indicator_categories_manage ON public.indicator_categories FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'settings.edit')) WITH CHECK (public.has_perm(auth.uid(),'settings.edit'));

CREATE POLICY employees_select ON public.employees FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (public.has_perm(auth.uid(),'employees.view') AND public.in_scope(auth.uid(), department_id, team_id, subgroup_id, id)));
CREATE POLICY employees_manage ON public.employees FOR ALL TO authenticated
  USING (public.has_perm(auth.uid(),'employees.edit') AND public.in_scope(auth.uid(), department_id, team_id, subgroup_id, id))
  WITH CHECK (public.has_perm(auth.uid(),'employees.edit') AND public.in_scope(auth.uid(), department_id, team_id, subgroup_id, id));

CREATE POLICY indicators_select ON public.indicators FOR SELECT TO authenticated
  USING (public.has_perm(auth.uid(),'indicators.view') AND public.in_scope(auth.uid(), department_id, team_id, subgroup_id, responsavel_id));
CREATE POLICY indicators_manage ON public.indicators FOR ALL TO authenticated
  USING (public.has_perm(auth.uid(),'indicators.edit')) WITH CHECK (public.has_perm(auth.uid(),'indicators.edit'));

CREATE POLICY goals_select ON public.goals FOR SELECT TO authenticated
  USING (public.has_perm(auth.uid(),'goals.view') AND public.in_scope(auth.uid(), department_id, team_id, subgroup_id, employee_id));
CREATE POLICY goals_manage ON public.goals FOR ALL TO authenticated
  USING (public.has_perm(auth.uid(),'goals.edit')) WITH CHECK (public.has_perm(auth.uid(),'goals.edit'));

CREATE POLICY goal_history_select ON public.goal_history FOR SELECT TO authenticated USING (public.has_perm(auth.uid(),'goals.view'));
CREATE POLICY goal_history_manage ON public.goal_history FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'goals.edit')) WITH CHECK (public.has_perm(auth.uid(),'goals.edit'));

CREATE POLICY results_select ON public.results FOR SELECT TO authenticated
  USING (public.has_perm(auth.uid(),'results.view') AND public.in_scope(auth.uid(), department_id, team_id, NULL, employee_id));
CREATE POLICY results_manage ON public.results FOR ALL TO authenticated
  USING (public.has_perm(auth.uid(),'results.create') AND public.in_scope(auth.uid(), department_id, team_id, NULL, employee_id))
  WITH CHECK (public.has_perm(auth.uid(),'results.create') AND public.in_scope(auth.uid(), department_id, team_id, NULL, employee_id));

CREATE POLICY analyses_select ON public.analyses FOR SELECT TO authenticated USING (public.has_perm(auth.uid(),'analyses.view'));
CREATE POLICY analyses_manage ON public.analyses FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'analyses.create')) WITH CHECK (public.has_perm(auth.uid(),'analyses.create'));

CREATE POLICY action_plans_select ON public.action_plans FOR SELECT TO authenticated
  USING (public.has_perm(auth.uid(),'action_plans.view') AND public.in_scope(auth.uid(), NULL, team_id, NULL, quem));
CREATE POLICY action_plans_manage ON public.action_plans FOR ALL TO authenticated
  USING (public.has_perm(auth.uid(),'action_plans.edit')) WITH CHECK (public.has_perm(auth.uid(),'action_plans.edit'));

CREATE POLICY period_closures_manage ON public.period_closures FOR ALL TO authenticated
  USING (public.has_perm(auth.uid(),'results.reopen_period')) WITH CHECK (public.has_perm(auth.uid(),'results.reopen_period'));

CREATE POLICY presentations_manage ON public.presentations FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'presentations.edit')) WITH CHECK (public.has_perm(auth.uid(),'presentations.edit'));
CREATE POLICY presentation_slides_manage ON public.presentation_slides FOR ALL TO authenticated USING (public.has_perm(auth.uid(),'presentations.edit')) WITH CHECK (public.has_perm(auth.uid(),'presentations.edit'));