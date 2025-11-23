-- ========================================
-- KAISHO DOJOTIME - FRESH DATABASE SETUP
-- Führen Sie dieses komplette Script in Supabase aus
-- ========================================

-- Schritt 1: ALLES LÖSCHEN (Clean Slate)
-- ========================================

DROP TABLE IF EXISTS public.training_entries CASCADE;
DROP TABLE IF EXISTS public.trainers CASCADE;
DROP TABLE IF EXISTS public.training_days CASCADE;
DROP TABLE IF EXISTS public.clubs CASCADE;

DROP FUNCTION IF EXISTS public.create_trainer CASCADE;
DROP FUNCTION IF EXISTS public.verify_trainer CASCADE;

-- Schritt 2: EXTENSIONS
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schritt 3: TABELLEN ERSTELLEN
-- ========================================

-- Vereine
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT,
  slug TEXT NOT NULL UNIQUE,
  admin_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainingstage-Konfiguration pro Verein
CREATE TABLE public.training_days (
  id BIGSERIAL PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  time_start TIME NOT NULL,
  time_end TIME,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainer (Benutzer mit Login)
CREATE TABLE public.trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainer-Einträge
CREATE TABLE public.training_entries (
  id BIGSERIAL PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  training_day_id BIGINT NOT NULL REFERENCES public.training_days(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  training_date DATE NOT NULL,
  trainer_name TEXT NOT NULL,
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schritt 4: INDEXES
-- ========================================

CREATE INDEX idx_training_days_club_id ON public.training_days(club_id);
CREATE INDEX idx_training_days_active ON public.training_days(club_id, is_active);
CREATE INDEX idx_trainers_club_id ON public.trainers(club_id);
CREATE INDEX idx_trainers_email ON public.trainers(email);
CREATE INDEX idx_training_entries_club_id ON public.training_entries(club_id);
CREATE INDEX idx_training_entries_trainer_id ON public.training_entries(trainer_id);
CREATE INDEX idx_training_entries_date ON public.training_entries(training_date);

-- Schritt 5: ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_entries ENABLE ROW LEVEL SECURITY;

-- Policies für clubs
CREATE POLICY "clubs_select_policy" ON public.clubs
  FOR SELECT USING (true);

-- Policies für training_days
CREATE POLICY "training_days_select_policy" ON public.training_days
  FOR SELECT USING (true);

CREATE POLICY "training_days_all_policy" ON public.training_days
  FOR ALL USING (true) WITH CHECK (true);

-- Policies für trainers
CREATE POLICY "trainers_insert_policy" ON public.trainers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "trainers_select_policy" ON public.trainers
  FOR SELECT USING (true);

-- Policies für training_entries
CREATE POLICY "training_entries_select_policy" ON public.training_entries
  FOR SELECT USING (true);

CREATE POLICY "training_entries_insert_policy" ON public.training_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "training_entries_all_policy" ON public.training_entries
  FOR ALL USING (true) WITH CHECK (true);

-- Schritt 6: FUNCTIONS
-- ========================================

-- Funktion zum Erstellen eines Trainers
CREATE OR REPLACE FUNCTION public.create_trainer(
  p_email TEXT,
  p_name TEXT,
  p_password TEXT,
  p_club_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trainer_id UUID;
BEGIN
  INSERT INTO public.trainers (email, name, password_hash, club_id)
  VALUES (p_email, p_name, crypt(p_password, gen_salt('bf')), p_club_id)
  RETURNING id INTO v_trainer_id;
  
  RETURN v_trainer_id;
END;
$$;

-- Funktion zum Verifizieren eines Trainers
CREATE OR REPLACE FUNCTION public.verify_trainer(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  club_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.email, t.name, t.club_id
  FROM public.trainers t
  WHERE t.email = p_email 
    AND t.password_hash = crypt(p_password, t.password_hash);
END;
$$;

-- Schritt 7: PERMISSIONS
-- ========================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Schritt 8: BEISPIEL-DATEN
-- ========================================

-- Vereine einfügen
INSERT INTO public.clubs (name, city, slug, admin_password) VALUES
  ('Kaisho Budo Akademie – Zürich Höngg', 'Zürich Höngg', 'kaisho-budo-akademie-zuerich-hoengg', 'admin123'),
  ('Karate Kai – Winterthur', 'Winterthur', 'karate-kai-winterthur', 'admin123'),
  ('Kaisho Karate – Bassersdorf', 'Bassersdorf', 'kaisho-karate-bassersdorf', 'admin123'),
  ('Karate Kai – Frauenfeld', 'Frauenfeld', 'karate-kai-frauenfeld', 'admin123'),
  ('Karate Kai – Wiesendangen', 'Wiesendangen', 'karate-kai-wiesendangen', 'admin123');

-- Beispiel-Trainingstage für Kaisho Budo Akademie
DO $$
DECLARE
  v_club_id UUID;
BEGIN
  SELECT id INTO v_club_id FROM public.clubs WHERE slug = 'kaisho-budo-akademie-zuerich-hoengg';
  
  IF v_club_id IS NOT NULL THEN
    INSERT INTO public.training_days (club_id, weekday, time_start, time_end) VALUES
      (v_club_id, 1, '18:00', '19:30'),  -- Montag
      (v_club_id, 3, '18:00', '19:30'),  -- Mittwoch
      (v_club_id, 5, '17:00', '18:30');  -- Freitag
  END IF;
END $$;

-- Beispiel-Trainingstage für Karate Kai Winterthur
DO $$
DECLARE
  v_club_id UUID;
BEGIN
  SELECT id INTO v_club_id FROM public.clubs WHERE slug = 'karate-kai-winterthur';
  
  IF v_club_id IS NOT NULL THEN
    INSERT INTO public.training_days (club_id, weekday, time_start, time_end) VALUES
      (v_club_id, 2, '19:00', '20:30'),  -- Dienstag
      (v_club_id, 4, '19:00', '20:30');  -- Donnerstag
  END IF;
END $$;

-- ========================================
-- ✅ FERTIG! Die Datenbank ist bereit.
-- ========================================
