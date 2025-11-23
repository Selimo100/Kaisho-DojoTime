-- ========================================
-- ERWEITERUNG: Training Overrides
-- Führen Sie dieses Script zusätzlich aus
-- ========================================

-- Tabelle für Ausnahmen (Absagen, Extra-Trainings)
CREATE TABLE IF NOT EXISTS public.training_overrides (
  id BIGSERIAL PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  time_start TIME,
  time_end TIME,
  action TEXT NOT NULL CHECK (action IN ('cancel', 'extra')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_training_overrides_club_date 
  ON public.training_overrides(club_id, override_date);

-- RLS aktivieren
ALTER TABLE public.training_overrides ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "training_overrides_select_policy" ON public.training_overrides;
CREATE POLICY "training_overrides_select_policy" 
  ON public.training_overrides FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "training_overrides_insert_policy" ON public.training_overrides;
CREATE POLICY "training_overrides_insert_policy" 
  ON public.training_overrides FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "training_overrides_all_policy" ON public.training_overrides;
CREATE POLICY "training_overrides_all_policy" 
  ON public.training_overrides FOR ALL 
  USING (true) WITH CHECK (true);

-- Permissions
GRANT ALL ON public.training_overrides TO anon, authenticated;
GRANT ALL ON SEQUENCE training_overrides_id_seq TO anon, authenticated;