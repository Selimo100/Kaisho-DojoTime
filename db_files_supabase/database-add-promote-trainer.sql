-- ========================================
-- FUNKTION: Trainer zu Admin befördern
-- Diese Funktion kopiert das Passwort-Hash
-- ========================================

CREATE OR REPLACE FUNCTION promote_trainer_to_admin(
  p_trainer_id UUID,
  p_is_super_admin BOOLEAN DEFAULT false
)
RETURNS BIGINT AS $$
DECLARE
  v_admin_id BIGINT;
  v_trainer RECORD;
BEGIN
  -- Hole Trainer-Daten
  SELECT * INTO v_trainer
  FROM public.trainers
  WHERE id = p_trainer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trainer nicht gefunden';
  END IF;
  
  -- Erstelle Admin mit gleichem Passwort-Hash
  INSERT INTO public.admins (username, password_hash, email, full_name, is_super_admin, club_id)
  VALUES (
    split_part(v_trainer.email, '@', 1), -- Username aus E-Mail
    v_trainer.password_hash,              -- Kopiere Passwort-Hash
    v_trainer.email,
    v_trainer.name,
    p_is_super_admin,
    v_trainer.club_id
  )
  RETURNING id INTO v_admin_id;
  
  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION promote_trainer_to_admin(UUID, BOOLEAN) TO anon, authenticated;
