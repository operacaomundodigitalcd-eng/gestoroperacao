
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_launch(uuid) TO authenticated;
