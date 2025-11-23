-- ========================================
-- ERWEITERUNG: Admin-System
-- Führen Sie dieses Script zusätzlich aus
-- ========================================

-- Tabelle für Admin-User
CREATE TABLE IF NOT EXISTS public.admins (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  full_name TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_club_id ON public.admins(club_id);

-- RLS aktivieren
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "admins_select_policy" ON public.admins;
CREATE POLICY "admins_select_policy" 
  ON public.admins FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "admins_insert_policy" ON public.admins;
CREATE POLICY "admins_insert_policy" 
  ON public.admins FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "admins_update_policy" ON public.admins;
CREATE POLICY "admins_update_policy" 
  ON public.admins FOR UPDATE 
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admins_delete_policy" ON public.admins;
CREATE POLICY "admins_delete_policy" 
  ON public.admins FOR DELETE 
  USING (true);

-- Permissions
GRANT ALL ON public.admins TO anon, authenticated;
GRANT ALL ON SEQUENCE admins_id_seq TO anon, authenticated;

-- Funktion zum Erstellen eines Admins
CREATE OR REPLACE FUNCTION create_admin(
  p_username TEXT,
  p_password TEXT,
  p_email TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_is_super_admin BOOLEAN DEFAULT false,
  p_club_id UUID DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_admin_id BIGINT;
BEGIN
  INSERT INTO public.admins (username, password_hash, email, full_name, is_super_admin, club_id)
  VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_email,
    p_full_name,
    p_is_super_admin,
    p_club_id
  )
  RETURNING id INTO v_admin_id;
  
  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion zum Verifizieren eines Admins
CREATE OR REPLACE FUNCTION verify_admin(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE(
  id BIGINT,
  username TEXT,
  email TEXT,
  full_name TEXT,
  is_super_admin BOOLEAN,
  club_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.username,
    a.email,
    a.full_name,
    a.is_super_admin,
    a.club_id
  FROM public.admins a
  WHERE a.username = p_username
    AND a.password_hash = crypt(p_password, a.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Super-Admin erstellen (username: admin, password: admin123)
SELECT create_admin('admin', 'admin123', 'admin@kaisho.de', 'System Administrator', true, NULL);

-- Club-spezifische Admins für jeden Verein erstellen
DO $$
DECLARE
  club_rec RECORD;
BEGIN
  FOR club_rec IN SELECT id, slug FROM public.clubs LOOP
    -- Admin für jeden Club: username = clubslug_admin, password = admin123
    PERFORM create_admin(
      club_rec.slug || '_admin',
      'admin123',
      club_rec.slug || '_admin@kaisho.de',
      'Club Admin ' || club_rec.slug,
      false,
      club_rec.id
    );
  END LOOP;
END $$;
