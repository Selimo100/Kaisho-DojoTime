-- ========================================
-- MIGRATION: Passwort-Reset für Trainer
-- Erlaubt das Zurücksetzen des Passworts anhand von E-Mail + Club
-- ========================================

CREATE OR REPLACE FUNCTION public.reset_trainer_password(
  p_email TEXT,
  p_club_id UUID,
  p_new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_rows INTEGER;
BEGIN
  IF p_new_password IS NULL OR length(trim(p_new_password)) < 6 THEN
    RAISE EXCEPTION 'Das neue Passwort muss mindestens 6 Zeichen lang sein';
  END IF;

  UPDATE public.trainers
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE email = trim(p_email)
    AND club_id = p_club_id;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  IF v_updated_rows = 0 THEN
    RAISE EXCEPTION 'Kein Trainerkonto für diese E-Mail in diesem Verein gefunden';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_trainer_password TO anon, authenticated, service_role;
