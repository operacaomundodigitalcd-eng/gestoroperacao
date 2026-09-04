CREATE OR REPLACE FUNCTION public.has_perm(_uid uuid, _code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _uid IS NULL OR (auth.uid() IS NOT NULL AND _uid <> auth.uid()) THEN false
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

GRANT EXECUTE ON FUNCTION public.has_perm(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.in_scope(uuid, uuid, uuid, uuid, uuid) TO authenticated;
