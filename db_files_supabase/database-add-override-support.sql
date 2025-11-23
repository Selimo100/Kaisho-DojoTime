-- ========================================
-- FIX: Add override_id support for Extra-Training entries
-- Ermöglicht Trainer-Einträge für Extra-Trainings
-- ========================================

-- 1. Füge override_id Spalte hinzu (optional, für Extra-Trainings)
ALTER TABLE public.training_entries
ADD COLUMN IF NOT EXISTS override_id BIGINT REFERENCES public.training_overrides(id) ON DELETE CASCADE;

-- 2. Ändere training_day_id zu NULLABLE (weil Extra-Trainings keine training_day_id haben)
ALTER TABLE public.training_entries
ALTER COLUMN training_day_id DROP NOT NULL;

-- 3. Füge CHECK constraint hinzu: Entweder training_day_id ODER override_id muss gesetzt sein
ALTER TABLE public.training_entries
ADD CONSTRAINT check_training_or_override
CHECK (
  (training_day_id IS NOT NULL AND override_id IS NULL) OR
  (training_day_id IS NULL AND override_id IS NOT NULL)
);

-- 4. Update UNIQUE constraint: Verhindere Duplikate für normale Trainings UND Extra-Trainings
-- Erst alten constraint löschen falls vorhanden
ALTER TABLE public.training_entries
DROP CONSTRAINT IF EXISTS unique_trainer_per_training_day_date;

-- Neuer Unique Index für normale Trainings
CREATE UNIQUE INDEX unique_trainer_per_training_day_date
ON public.training_entries (training_day_id, trainer_id, training_date)
WHERE training_day_id IS NOT NULL;

-- Neuer Unique Index für Extra-Trainings
CREATE UNIQUE INDEX unique_trainer_per_override_date
ON public.training_entries (override_id, trainer_id, training_date)
WHERE override_id IS NOT NULL;

-- 5. Index für bessere Performance bei override_id queries
CREATE INDEX idx_training_entries_override_id ON public.training_entries(override_id)
WHERE override_id IS NOT NULL;

-- ========================================
-- ERFOLG! Extra-Trainings sind jetzt voll unterstützt.
-- Trainer können sich sowohl für normale als auch Extra-Trainings eintragen.
-- ========================================
