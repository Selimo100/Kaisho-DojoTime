-- ========================================
-- ERWEITERUNG: Einzelne Trainings absagen
-- 
-- Problem: Wenn zwei Trainings zur gleichen Zeit sind, 
-- werden beide abgesagt. Wir brauchen training_day_id
-- in training_overrides um nur eines abzusagen.
-- ========================================

-- 1. Spalte training_day_id zur training_overrides Tabelle hinzufügen
ALTER TABLE public.training_overrides 
ADD COLUMN IF NOT EXISTS training_day_id BIGINT REFERENCES public.training_days(id) ON DELETE CASCADE;

-- 2. Index für Performance
CREATE INDEX IF NOT EXISTS idx_training_overrides_training_day_id 
ON public.training_overrides(training_day_id);

-- 3. Policy für delete auf training_entries (für Austragen)
DROP POLICY IF EXISTS "training_entries_delete_policy" ON public.training_entries;
CREATE POLICY "training_entries_delete_policy" 
  ON public.training_entries 
  FOR DELETE 
  USING (true);

-- ========================================
-- ✅ FERTIG! Jetzt können einzelne Trainings
-- unabhängig voneinander abgesagt werden.
-- ========================================
