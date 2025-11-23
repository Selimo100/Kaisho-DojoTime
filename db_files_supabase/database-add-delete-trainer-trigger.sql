-- ========================================
-- TRIGGER: Admin-Account beim Löschen des Trainers auch löschen
-- ========================================

-- Funktion die den Admin-Account löscht wenn ein Trainer gelöscht wird
CREATE OR REPLACE FUNCTION delete_admin_on_trainer_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Lösche Admin-Account mit gleicher E-Mail
  DELETE FROM public.admins
  WHERE email = OLD.email;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger erstellen
DROP TRIGGER IF EXISTS trigger_delete_admin_on_trainer_delete ON public.trainers;
CREATE TRIGGER trigger_delete_admin_on_trainer_delete
  BEFORE DELETE ON public.trainers
  FOR EACH ROW
  EXECUTE FUNCTION delete_admin_on_trainer_delete();
