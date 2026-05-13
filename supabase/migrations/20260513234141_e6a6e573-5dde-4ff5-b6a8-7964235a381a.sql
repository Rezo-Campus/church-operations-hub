CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION app_private.is_admin_general(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app_private.has_role(_user_id, 'admin_general'::public.app_role)
$$;

GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_admin_general(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_general(uuid) FROM PUBLIC, anon, authenticated;

ALTER POLICY "Archives admin general all" ON public.archives
  USING (app_private.is_admin_general(auth.uid()));
ALTER POLICY "Archives admin general delete" ON public.archives
  USING (app_private.is_admin_general(auth.uid()));
ALTER POLICY "Archives admin general update" ON public.archives
  USING (app_private.is_admin_general(auth.uid()));

ALTER POLICY "Patrimoine read batiments" ON public.batiments
  USING (app_private.has_role(auth.uid(), 'admin_patrimoine'::public.app_role) OR app_private.is_admin_general(auth.uid()));
ALTER POLICY "Patrimoine write batiments" ON public.batiments
  USING (app_private.has_role(auth.uid(), 'admin_patrimoine'::public.app_role) OR app_private.is_admin_general(auth.uid()))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin_patrimoine'::public.app_role) OR app_private.is_admin_general(auth.uid()));

ALTER POLICY "Stock read" ON public.cartes_stock
  USING (app_private.has_role(auth.uid(), 'admin_stock'::public.app_role) OR app_private.is_admin_general(auth.uid()));
ALTER POLICY "Stock write" ON public.cartes_stock
  USING (app_private.has_role(auth.uid(), 'admin_stock'::public.app_role) OR app_private.is_admin_general(auth.uid()))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin_stock'::public.app_role) OR app_private.is_admin_general(auth.uid()));

ALTER POLICY "RH read" ON public.personnel
  USING (app_private.has_role(auth.uid(), 'admin_rh'::public.app_role) OR app_private.is_admin_general(auth.uid()));
ALTER POLICY "RH write" ON public.personnel
  USING (app_private.has_role(auth.uid(), 'admin_rh'::public.app_role) OR app_private.is_admin_general(auth.uid()))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin_rh'::public.app_role) OR app_private.is_admin_general(auth.uid()));

ALTER POLICY "Admin general view all profiles" ON public.profiles
  USING (app_private.is_admin_general(auth.uid()));

ALTER POLICY "Patrimoine read terrains" ON public.terrains
  USING (app_private.has_role(auth.uid(), 'admin_patrimoine'::public.app_role) OR app_private.is_admin_general(auth.uid()));
ALTER POLICY "Patrimoine write terrains" ON public.terrains
  USING (app_private.has_role(auth.uid(), 'admin_patrimoine'::public.app_role) OR app_private.is_admin_general(auth.uid()))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin_patrimoine'::public.app_role) OR app_private.is_admin_general(auth.uid()));

ALTER POLICY "Admin general manage roles" ON public.user_roles
  USING (app_private.is_admin_general(auth.uid()))
  WITH CHECK (app_private.is_admin_general(auth.uid()));
ALTER POLICY "Admin general view all roles" ON public.user_roles
  USING (app_private.is_admin_general(auth.uid()));

ALTER POLICY "Patrimoine read vehicules" ON public.vehicules
  USING (app_private.has_role(auth.uid(), 'admin_patrimoine'::public.app_role) OR app_private.is_admin_general(auth.uid()));
ALTER POLICY "Patrimoine write vehicules" ON public.vehicules
  USING (app_private.has_role(auth.uid(), 'admin_patrimoine'::public.app_role) OR app_private.is_admin_general(auth.uid()))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin_patrimoine'::public.app_role) OR app_private.is_admin_general(auth.uid()));