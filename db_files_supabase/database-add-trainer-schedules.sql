-- ========================================
-- TRAINER SCHEDULE MANAGEMENT
-- Ermöglicht Admins, wiederkehrende Zeitpläne für Trainer zu erstellen
-- ========================================

-- Tabelle für wiederkehrende Trainer-Zeitpläne
CREATE TABLE IF NOT EXISTS public.trainer_schedules (
  id BIGSERIAL PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  training_day_id BIGINT NOT NULL REFERENCES public.training_days(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = unbegrenzt
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_admin_id INTEGER REFERENCES public.admins(id),
  notes TEXT,
  UNIQUE(trainer_id, training_day_id, start_date)
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_trainer_schedules_trainer_id ON public.trainer_schedules(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_schedules_training_day_id ON public.trainer_schedules(training_day_id);
CREATE INDEX IF NOT EXISTS idx_trainer_schedules_dates ON public.trainer_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trainer_schedules_active ON public.trainer_schedules(is_active);

-- Row Level Security
ALTER TABLE public.trainer_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_schedules_select_policy" ON public.trainer_schedules
  FOR SELECT USING (true);

CREATE POLICY "trainer_schedules_all_policy" ON public.trainer_schedules
  FOR ALL USING (true) WITH CHECK (true);

-- Funktion um automatisch Trainer-Einträge basierend auf Zeitplänen zu erstellen
CREATE OR REPLACE FUNCTION public.create_trainer_from_schedule(
  p_email TEXT,
  p_name TEXT,
  p_password TEXT,
  p_club_id UUID,
  p_training_schedules JSONB, -- Array von {training_day_id, start_date, end_date, notes}
  p_admin_id INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trainer_id UUID;
  v_schedule JSONB;
BEGIN
  -- Trainer erstellen
  INSERT INTO public.trainers (email, name, password_hash, club_id)
  VALUES (p_email, p_name, crypt(p_password, gen_salt('bf')), p_club_id)
  RETURNING id INTO v_trainer_id;
  
  -- Zeitpläne hinzufügen
  IF p_training_schedules IS NOT NULL THEN
    FOR v_schedule IN SELECT * FROM jsonb_array_elements(p_training_schedules)
    LOOP
      INSERT INTO public.trainer_schedules (
        trainer_id,
        training_day_id,
        start_date,
        end_date,
        notes,
        created_by_admin_id
      )
      VALUES (
        v_trainer_id,
        (v_schedule->>'training_day_id')::BIGINT,
        (v_schedule->>'start_date')::DATE,
        (v_schedule->>'end_date')::DATE,
        v_schedule->>'notes',
        p_admin_id
      );
    END LOOP;
  END IF;
  
  RETURN v_trainer_id;
END;
$$;

-- Funktion um Zeitpläne für einen Trainer zu aktualisieren
CREATE OR REPLACE FUNCTION public.update_trainer_schedule(
  p_schedule_id BIGINT,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.trainer_schedules
  SET
    start_date = COALESCE(p_start_date, start_date),
    end_date = COALESCE(p_end_date, end_date),
    is_active = COALESCE(p_is_active, is_active),
    notes = COALESCE(p_notes, notes)
  WHERE id = p_schedule_id;
END;
$$;

-- Funktion um aktive Zeitpläne für ein bestimmtes Datum zu finden
CREATE OR REPLACE FUNCTION public.get_trainers_for_date(
  p_club_id UUID,
  p_date DATE
)
RETURNS TABLE(
  trainer_id UUID,
  trainer_name TEXT,
  trainer_email TEXT,
  training_day_id BIGINT,
  schedule_notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.email,
    ts.training_day_id,
    ts.notes
  FROM public.trainer_schedules ts
  JOIN public.trainers t ON ts.trainer_id = t.id
  JOIN public.training_days td ON ts.training_day_id = td.id
  WHERE 
    t.club_id = p_club_id
    AND ts.is_active = true
    AND ts.start_date <= p_date
    AND (ts.end_date IS NULL OR ts.end_date >= p_date)
    AND td.weekday = EXTRACT(DOW FROM p_date);
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.create_trainer_from_schedule TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_trainer_schedule TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trainers_for_date TO anon, authenticated;
