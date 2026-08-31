REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_manage(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_launch(uuid) FROM anon, authenticated;