GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_general(uuid) TO authenticated;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin_general'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.role = 'admin_general'::public.app_role
)
ORDER BY u.created_at ASC
LIMIT 1
ON CONFLICT DO NOTHING;