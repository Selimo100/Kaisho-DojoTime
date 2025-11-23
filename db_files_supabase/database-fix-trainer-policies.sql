-- ========================================
-- POLICY: Trainer löschen erlauben
-- Diese Policy fehlt im ursprünglichen Setup
-- ========================================

-- DELETE Policy für trainers hinzufügen
DROP POLICY IF EXISTS "trainers_delete_policy" ON public.trainers;
CREATE POLICY "trainers_delete_policy" 
  ON public.trainers 
  FOR DELETE 
  USING (true);

-- UPDATE Policy für trainers hinzufügen (falls auch nicht vorhanden)
DROP POLICY IF EXISTS "trainers_update_policy" ON public.trainers;
CREATE POLICY "trainers_update_policy" 
  ON public.trainers 
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);
