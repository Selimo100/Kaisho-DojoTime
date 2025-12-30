-- ========================================
-- ERWEITERUNG: Deleted Trainers Tracking
-- Ermöglicht das Nachverfolgen von gelöschten Trainern
-- ========================================

-- 1. Tabelle für gelöschte Trainer erstellen
CREATE TABLE IF NOT EXISTS public.deleted_trainers (
  id BIGSERIAL PRIMARY KEY,
  original_id UUID,
  email TEXT,
  name TEXT,
  club_id UUID,
  club_name TEXT,
  original_created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS aktivieren
ALTER TABLE public.deleted_trainers ENABLE ROW LEVEL SECURITY;

-- 3. Policies erstellen (nur für Authentifizierte lesbar, oder spezifisch für Admins/Devs)
-- Der Einfachheit halber hier für alle Authentifizierten lesbar, 
-- da die App-Logik (DeveloperPanel) den Zugriff steuert.
CREATE POLICY "deleted_trainers_select_policy" 
  ON public.deleted_trainers FOR SELECT 
  USING (true);

-- Insert Policy für den Trigger (Server-side)
CREATE POLICY "deleted_trainers_insert_policy" 
  ON public.deleted_trainers FOR INSERT 
  WITH CHECK (true);

-- 4. Trigger-Funktion erstellen
CREATE OR REPLACE FUNCTION archive_deleted_trainer()
RETURNS TRIGGER AS $$
DECLARE
  v_club_name TEXT;
BEGIN
  -- Versuche den Club-Namen zu finden
  SELECT name INTO v_club_name FROM public.clubs WHERE id = OLD.club_id;

  INSERT INTO public.deleted_trainers (
    original_id,
    email,
    name,
    club_id,
    club_name,
    original_created_at
  ) VALUES (
    OLD.id,
    OLD.email,
    OLD.name,
    OLD.club_id,
    v_club_name,
    OLD.created_at
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger erstellen
DROP TRIGGER IF EXISTS trigger_archive_deleted_trainer ON public.trainers;
CREATE TRIGGER trigger_archive_deleted_trainer
  BEFORE DELETE ON public.trainers
  FOR EACH ROW
  EXECUTE FUNCTION archive_deleted_trainer();

-- Permissions
GRANT ALL ON public.deleted_trainers TO anon, authenticated;
GRANT ALL ON SEQUENCE deleted_trainers_id_seq TO anon, authenticated;
