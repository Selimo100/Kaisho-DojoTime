-- ========================================
-- FIX: Prevent Duplicate Training Entries
-- Verhindert dass ein Trainer sich mehrfach am gleichen Tag für das gleiche Training einträgt
-- ========================================

-- Füge UNIQUE constraint hinzu um Doppel-Einträge zu verhindern
-- Ein Trainer kann sich nur EINMAL pro training_day_id und training_date eintragen
ALTER TABLE public.training_entries
ADD CONSTRAINT unique_trainer_per_training_day_date 
UNIQUE (training_day_id, trainer_id, training_date);

-- ========================================
-- HINWEIS:
-- Falls bereits Duplikate existieren, müssen diese zuerst gelöscht werden:
--
-- 1. Duplikate finden:
-- SELECT training_day_id, trainer_id, training_date, COUNT(*) 
-- FROM public.training_entries 
-- GROUP BY training_day_id, trainer_id, training_date 
-- HAVING COUNT(*) > 1;
--
-- 2. Duplikate löschen (behält nur den neuesten):
-- DELETE FROM public.training_entries a
-- USING public.training_entries b
-- WHERE a.id < b.id
-- AND a.training_day_id = b.training_day_id
-- AND a.trainer_id = b.trainer_id
-- AND a.training_date = b.training_date;
--
-- 3. Danach dieses Script ausführen
-- ========================================
