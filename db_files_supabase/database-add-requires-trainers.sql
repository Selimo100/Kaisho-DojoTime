-- ========================================
-- ERWEITERUNG: Requires Trainers für Events
-- Fügt Option hinzu, ob ein Event Trainer benötigt
-- ========================================

-- Füge Spalte requires_trainers zur training_overrides Tabelle hinzu
ALTER TABLE public.training_overrides 
  ADD COLUMN IF NOT EXISTS requires_trainers BOOLEAN DEFAULT true;

-- Index für Performance (optional, falls häufig nach requires_trainers gefiltert wird)
CREATE INDEX IF NOT EXISTS idx_training_overrides_requires_trainers 
  ON public.training_overrides(requires_trainers);

-- Kommentar zur Spalte
COMMENT ON COLUMN public.training_overrides.requires_trainers IS 
  'Gibt an, ob für dieses Event Trainer erforderlich sind. Standard: true';
