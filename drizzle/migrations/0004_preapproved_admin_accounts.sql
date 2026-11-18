INSERT INTO public.portfolio_admin_invites (email, invited_by)
VALUES
  ('davidusim15@gmail.com', NULL),
  ('usimthemodel@gmail.com', NULL)
ON CONFLICT (email) DO NOTHING;
