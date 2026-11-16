CREATE TABLE IF NOT EXISTS public.portfolio_admin_invites (
  email TEXT PRIMARY KEY,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_admin_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.portfolio_admin_invites FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.portfolio_admin_invites TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.invite_portfolio_admin(target_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  normalized_email TEXT := lower(btrim(target_email));
  existing_user_id UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only portfolio administrators can invite editors';
  END IF;

  IF normalized_email IS NULL OR length(normalized_email) > 254
     OR normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Enter a valid email address';
  END IF;

  INSERT INTO public.portfolio_admin_invites (email, invited_by)
  VALUES (normalized_email, auth.uid())
  ON CONFLICT (email) DO UPDATE
    SET invited_by = EXCLUDED.invited_by, created_at = now();

  SELECT users.id INTO existing_user_id
  FROM auth.users AS users
  WHERE lower(users.email) = normalized_email
    AND users.email_confirmed_at IS NOT NULL
  LIMIT 1;

  IF existing_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (existing_user_id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.invite_portfolio_admin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_portfolio_admin(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.assign_portfolio_admin_to_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND (
    lower(COALESCE(NEW.email, '')) = 'ezinne.emm@gmail.com'
    OR EXISTS (
      SELECT 1
      FROM public.portfolio_admin_invites AS invites
      WHERE invites.email = lower(COALESCE(NEW.email, ''))
    )
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
