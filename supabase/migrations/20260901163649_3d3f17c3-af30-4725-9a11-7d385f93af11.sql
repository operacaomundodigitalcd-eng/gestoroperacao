
-- helper inline predicates are used directly in policies (no user-callable functions)

-- 1) user_roles: own rows only
DROP POLICY IF EXISTS user_roles_select_auth ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2) profiles
DROP POLICY IF EXISTS profiles_select_auth ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );
CREATE POLICY profiles_admin_write ON public.profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- 3) audit_logs: admins only
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select_admin ON public.audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- 4) employees
DROP POLICY IF EXISTS employees_select ON public.employees;
DROP POLICY IF EXISTS employees_manage ON public.employees;
CREATE POLICY employees_select_scoped ON public.employees FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor'))
  );
CREATE POLICY employees_manage ON public.employees FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor')));

-- 5) goals
DROP POLICY IF EXISTS goals_select ON public.goals;
DROP POLICY IF EXISTS goals_manage ON public.goals;
CREATE POLICY goals_select_scoped ON public.goals FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor'))
    OR EXISTS (
      SELECT 1 FROM public.employees me
      WHERE me.user_id = auth.uid()
        AND (me.id = goals.employee_id
             OR (goals.team_id IS NOT NULL AND me.team_id = goals.team_id)
             OR (goals.department_id IS NOT NULL AND me.department_id = goals.department_id)
             OR (goals.subgroup_id IS NOT NULL AND me.subgroup_id = goals.subgroup_id))
    )
  );
CREATE POLICY goals_manage ON public.goals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor')));

-- 6) results
DROP POLICY IF EXISTS results_select ON public.results;
DROP POLICY IF EXISTS results_launch ON public.results;
CREATE POLICY results_select_scoped ON public.results FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor'))
    OR EXISTS (
      SELECT 1 FROM public.employees me
      WHERE me.user_id = auth.uid()
        AND (me.id = results.employee_id
             OR (results.team_id IS NOT NULL AND me.team_id = results.team_id)
             OR (results.department_id IS NOT NULL AND me.department_id = results.department_id))
    )
  );
CREATE POLICY results_launch ON public.results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor')));

-- 7) analyses
DROP POLICY IF EXISTS analyses_select ON public.analyses;
DROP POLICY IF EXISTS analyses_launch ON public.analyses;
CREATE POLICY analyses_select_scoped ON public.analyses FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor'))
    OR EXISTS (
      SELECT 1 FROM public.indicators i, public.employees me
      WHERE i.id = analyses.indicator_id AND me.user_id = auth.uid()
        AND ((i.team_id IS NOT NULL AND me.team_id = i.team_id)
             OR (i.department_id IS NOT NULL AND me.department_id = i.department_id))
    )
  );
CREATE POLICY analyses_launch ON public.analyses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor')));

-- 8) action_plans
DROP POLICY IF EXISTS action_plans_select ON public.action_plans;
DROP POLICY IF EXISTS action_plans_launch ON public.action_plans;
CREATE POLICY action_plans_select_scoped ON public.action_plans FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor'))
    OR EXISTS (
      SELECT 1 FROM public.employees me
      WHERE me.user_id = auth.uid()
        AND (me.id = action_plans.quem
             OR (action_plans.team_id IS NOT NULL AND me.team_id = action_plans.team_id))
    )
  );
CREATE POLICY action_plans_launch ON public.action_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor')));

-- 9) goal_history
DROP POLICY IF EXISTS goal_history_select ON public.goal_history;
DROP POLICY IF EXISTS goal_history_launch ON public.goal_history;
CREATE POLICY goal_history_select_scoped ON public.goal_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_history.goal_id));
CREATE POLICY goal_history_launch ON public.goal_history FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor')));

-- 10) period_closures / other reference tables: replace function-based manage policies
DROP POLICY IF EXISTS period_closures_launch ON public.period_closures;
CREATE POLICY period_closures_launch ON public.period_closures FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor','supervisor')));

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['departments','teams','subgroups','indicators','indicator_categories','measure_units','positions','job_functions','work_schedules','presentations','presentation_slides'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_manage', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor')))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','gestor')))$f$, t || '_manage', t);
  END LOOP;
END $$;

-- 11) role-check helper functions are no longer callable by end users
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_manage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_launch(uuid) FROM PUBLIC, anon, authenticated;
