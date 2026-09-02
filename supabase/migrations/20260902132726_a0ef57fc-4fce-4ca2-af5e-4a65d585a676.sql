REVOKE EXECUTE ON FUNCTION public.protect_system_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_system_role_permissions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_last_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_access() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;