
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS observacoes text;

INSERT INTO public.permissions (code, module, action, description) VALUES
  ('teams.view','teams','view','Visualizar equipes'),
  ('teams.create','teams','create','Criar equipes'),
  ('teams.edit','teams','edit','Editar equipes'),
  ('teams.inactivate','teams','inactivate','Inativar equipes'),
  ('teams.reactivate','teams','reactivate','Reativar equipes'),
  ('teams.delete','teams','delete','Excluir equipes'),
  ('teams.manage_members','teams','manage_members','Gerenciar integrantes da equipe')
ON CONFLICT (code) DO NOTHING;

-- Perfis que já podiam configurar a estrutura recebem as novas permissões (exceto perfis de sistema, protegidos por trigger)
INSERT INTO public.role_permissions (role_id, permission_id, allowed)
SELECT rp.role_id, p.id, true
FROM public.role_permissions rp
JOIN public.permissions ps ON ps.id = rp.permission_id AND ps.code = 'settings.edit' AND rp.allowed
JOIN public.roles r ON r.id = rp.role_id AND NOT r.is_system_role
CROSS JOIN public.permissions p
WHERE p.module = 'teams' AND p.code <> 'teams.delete'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id, allowed)
SELECT r.id, p.id, true
FROM public.roles r
CROSS JOIN public.permissions p
WHERE NOT r.is_system_role AND p.code = 'teams.view'
ON CONFLICT DO NOTHING;

-- Policies de equipes por permissão + escopo
DROP POLICY IF EXISTS teams_manage ON public.teams;
DROP POLICY IF EXISTS teams_select ON public.teams;

CREATE POLICY teams_select ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY teams_insert ON public.teams FOR INSERT TO authenticated
  WITH CHECK (public.has_perm(auth.uid(), 'teams.create') OR public.has_perm(auth.uid(), 'settings.edit'));
CREATE POLICY teams_update ON public.teams FOR UPDATE TO authenticated
  USING ((public.has_perm(auth.uid(), 'teams.edit') OR public.has_perm(auth.uid(), 'settings.edit'))
         AND public.in_scope(auth.uid(), department_id, id, NULL, NULL))
  WITH CHECK ((public.has_perm(auth.uid(), 'teams.edit') OR public.has_perm(auth.uid(), 'settings.edit'))
         AND public.in_scope(auth.uid(), department_id, id, NULL, NULL));
CREATE POLICY teams_delete ON public.teams FOR DELETE TO authenticated
  USING (public.has_perm(auth.uid(), 'teams.delete')
         AND public.in_scope(auth.uid(), department_id, id, NULL, NULL));

-- Histórico de vínculo do colaborador com equipes
CREATE TABLE IF NOT EXISTS public.employee_team_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  subgroup_id uuid REFERENCES public.subgroups(id) ON DELETE SET NULL,
  inicio date NOT NULL DEFAULT current_date,
  fim date,
  motivo text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.employee_team_history TO authenticated;
GRANT ALL ON public.employee_team_history TO service_role;
ALTER TABLE public.employee_team_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eth_select ON public.employee_team_history;
CREATE POLICY eth_select ON public.employee_team_history FOR SELECT TO authenticated
  USING (public.has_perm(auth.uid(), 'employees.view') OR public.has_perm(auth.uid(), 'teams.view'));

CREATE INDEX IF NOT EXISTS employee_team_history_employee_idx ON public.employee_team_history(employee_id);
CREATE INDEX IF NOT EXISTS employee_team_history_team_idx ON public.employee_team_history(team_id);

CREATE OR REPLACE FUNCTION public.track_employee_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.team_id IS NOT NULL THEN
      INSERT INTO public.employee_team_history (employee_id, team_id, department_id, subgroup_id, inicio, changed_by)
      VALUES (NEW.id, NEW.team_id, NEW.department_id, NEW.subgroup_id, COALESCE(NEW.data_admissao, current_date), auth.uid());
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.team_id IS DISTINCT FROM OLD.team_id THEN
    UPDATE public.employee_team_history
       SET fim = current_date
     WHERE employee_id = OLD.id AND fim IS NULL;
    IF NEW.team_id IS NOT NULL THEN
      INSERT INTO public.employee_team_history (employee_id, team_id, department_id, subgroup_id, inicio, changed_by)
      VALUES (NEW.id, NEW.team_id, NEW.department_id, NEW.subgroup_id, current_date, auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.track_employee_team() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS employees_track_team ON public.employees;
CREATE TRIGGER employees_track_team
AFTER INSERT OR UPDATE OF team_id ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.track_employee_team();

-- Auditoria de equipes
DROP TRIGGER IF EXISTS teams_audit ON public.teams;
CREATE TRIGGER teams_audit
AFTER INSERT OR UPDATE OR DELETE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.audit_access();

DROP TRIGGER IF EXISTS teams_touch ON public.teams;
CREATE TRIGGER teams_touch BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Vínculos atuais viram histórico aberto
INSERT INTO public.employee_team_history (employee_id, team_id, department_id, subgroup_id, inicio)
SELECT e.id, e.team_id, e.department_id, e.subgroup_id, COALESCE(e.data_admissao, current_date)
FROM public.employees e
WHERE e.team_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employee_team_history h WHERE h.employee_id = e.id AND h.fim IS NULL);
