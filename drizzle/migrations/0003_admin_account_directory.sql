CREATE OR REPLACE FUNCTION public.sync_invited_portfolio_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  SELECT users.id INTO existing_user_id
  FROM auth.users AS users
  WHERE lower(users.email) = lower(NEW.email)
    AND users.email_confirmed_at IS NOT NULL
  LIMIT 1;

  IF existing_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (existing_user_id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_invited_portfolio_admin() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_portfolio_admin_invite_changed ON public.portfolio_admin_invites;
CREATE TRIGGER on_portfolio_admin_invite_changed
AFTER INSERT OR UPDATE ON public.portfolio_admin_invites
FOR EACH ROW
EXECUTE FUNCTION public.sync_invited_portfolio_admin();

CREATE OR REPLACE FUNCTION public.list_portfolio_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  is_admin BOOLEAN,
  has_invite BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only portfolio administrators can list accounts'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    users.id,
    users.email::TEXT,
    users.created_at,
    users.email_confirmed_at,
    users.last_sign_in_at,
    EXISTS (
      SELECT 1 FROM public.user_roles AS roles
      WHERE roles.user_id = users.id AND roles.role = 'admin'::public.app_role
    ),
    EXISTS (
      SELECT 1 FROM public.portfolio_admin_invites AS invites
      WHERE invites.email = lower(users.email)
    )
  FROM auth.users AS users
  WHERE users.email IS NOT NULL
  ORDER BY users.created_at DESC NULLS LAST
  LIMIT 250;
END;
$$;

REVOKE ALL ON FUNCTION public.list_portfolio_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_portfolio_users() TO authenticated;
